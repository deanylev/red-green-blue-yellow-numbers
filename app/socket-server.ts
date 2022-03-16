// node libraries
import { createServer } from 'http';
import { AddressInfo } from 'net';

// third party libraries
import express from 'express';
import { isPlainObject, shuffle } from 'lodash';
import { Server, Socket } from 'socket.io';

// our libraries
import {
  ALL_TYPES,
  COLOURS,
  ID_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PLAYERS,
  MIN_PLAYERS,
  NUMBERS,
  SPECIALS,
  WILDS,
  CardType,
  Colour,
  FailureReason,
  SerializedCard,
  SerializedGame,
  SerializedPlayer,
  Special,
  Wild
} from '../frontend/app/lib/shared';
import { generateNumber, getRandomElement } from './util';

// environment variables
const { PORT } = process.env;

// constants
const GAME_ROOM_PREFIX = 'GAME-';

class Card {
  colour: Colour | null;
  type: CardType;

  get isColour() {
    return !this.isWild;
  }

  get isWild() {
    return WILDS.includes(this.type as Wild);
  }

  get pointsValue() {
    if (SPECIALS.includes(this.type as Special)) {
      return 20;
    }

    if (WILDS.includes(this.type as Wild)) {
      return 50;
    }

    return parseInt(this.type, 10);
  }

  constructor(type: CardType, colour: Colour | null = null) {
    this.type = type;
    this.colour = colour;
  }

  serialize(): SerializedCard {
    return {
      colour: this.colour,
      type: this.type
    };
  }
};

class Player {
  cards: Card[] = [];
  name: string;
  points = 0;
  socket: Socket;

  constructor(name: string, socket: Socket) {
    this.name = name;
    this.socket = socket;
  }

  serialize(currentPlayer: Player | null, hostPlayer: Player | null, winningPlayer: Player | null): SerializedPlayer {
    return {
      cards: this.cards.map((card) => card.serialize()),
      current: this === currentPlayer,
      host: this === hostPlayer,
      name: this.name,
      points: this.points,
      winner: this === winningPlayer
    };
  }
}

class Game {
  ascendingOrder = true;
  cardsPlayed: Card[] = [];
  cardsRemaining: Card[] = [];
  currentPlayer: Player | null = null;
  destroyed = false;
  hostPlayer: Player | null = null;
  id: string;
  io: Server;
  players: Player[] = [];
  playersBySocket = new Map<Socket, Player>();
  playing = false;
  winningPlayer: Player | null = null;

  get lastCardPlayed(): Card | null {
    return this.cardsPlayed[0] ?? null;
  }

  get nextPlayerIndexDiff() {
    return this.ascendingOrder ? 1 : -1;
  }

  get roomId() {
    return `${GAME_ROOM_PREFIX}-${this.id}`;
  }

  constructor(id: string, io: Server) {
    this.id = id;
    this.io = io;
  }

  addPlayer(player: Player) {
    if (!this.hostPlayer) {
      this.hostPlayer = player;
    }

    this.players.push(player);
    this.playersBySocket.set(player.socket, player);
    player.socket.join(this.roomId);
  }

  assignPoints() {
    if (!this.winningPlayer) {
      return;
    }

    const points = this.players
      .flatMap((player) => player.cards)
      .map((card) => card.pointsValue)
      .reduce((prev, curr) => prev + curr, 0);
    this.winningPlayer.points += points;
  }

  destroy() {
    this.emit('game_data', null);

    this.players.forEach((player) => {
      player.socket.leave(this.roomId);
    });
  }

  emit(name: string, ...data: unknown[]) {
    this.io.to(this.roomId).emit(name, ...data);
  }

  end() {
    this.playing = false;
    this.cardsPlayed = [];
    this.cardsRemaining = [];
    this.currentPlayer = null;
    this.winningPlayer = null;
  }

  static generateId() {
    return generateNumber(ID_LENGTH).toString();
  }

  giveCardsToPlayer(player: Player, amount: number) {
    for (let i = 0; i < amount; i++) {
      player.cards.push(this.popTopCard());
    }
  }

  playCard(player: Player, card: Card) {
    player.cards = player.cards.filter((filteredCard) => filteredCard !== card);
    this.cardsPlayed.unshift(card);

    let nextPlayerIndex = this.wrapPlayerIndex(this.players.indexOf(player) + this.nextPlayerIndexDiff);
    const skipNextPlayer = () => nextPlayerIndex = this.wrapPlayerIndex(nextPlayerIndex + this.nextPlayerIndexDiff);

    switch (card.type) {
      case 'draw-2':
        this.giveCardsToPlayer(this.players[nextPlayerIndex], 2);
        skipNextPlayer();
        break;
      case 'draw-4':
        this.giveCardsToPlayer(this.players[nextPlayerIndex], 4);
        skipNextPlayer();
        break;
      case 'reverse':
        this.ascendingOrder = !this.ascendingOrder;
        nextPlayerIndex = this.wrapPlayerIndex(this.players.indexOf(player) + this.nextPlayerIndexDiff);
        break;
      case 'skip':
        skipNextPlayer();
        break;
      case 'wild':
    }

    if (player.cards.length > 0) {
      this.currentPlayer = this.players[nextPlayerIndex];
    } else {
      this.currentPlayer = null;
      this.winningPlayer = player;
      this.assignPoints();
    }

    this.refreshClients();
  }

  popTopCard() {
    const card = this.cardsRemaining.shift() as Card;
    if (this.cardsRemaining.length === 0) {
      const [first, ...rest] = this.cardsPlayed;
      this.cardsPlayed = [first];
      this.cardsRemaining = shuffle(rest);
    }

    return card;
  }

  refreshClients() {
    this.emit('game_data', this.serialize());
  }

  removePlayer(socket: Socket) {
    const player = this.playersBySocket.get(socket);
    if (!player) {
      return;
    }

    if (this.playing) {
      this.end();
    }

    this.playersBySocket.delete(socket);
    this.players = this.players.filter((filteredPlayer) => filteredPlayer !== player);

    if (this.players.length === 0) {
      this.destroy();
    } else if (this.hostPlayer === player) {
      this.hostPlayer = getRandomElement(this.players);
    }

    this.refreshClients();
  }

  reset() {
    // https://www.letsplayuno.com/news/guide/20181213/30092_732567.html

    this.cardsRemaining = shuffle([
      ...COLOURS.flatMap((colour) => {
        return [
          ...NUMBERS.flatMap((number) => Array.from(new Array(2), () => new Card(number, colour))),
          ...SPECIALS.map((special) => new Card(special, colour))
        ];
      }),
      ...WILDS.flatMap((type) => {
        return Array.from(new Array(4), () => new Card(type))
      })
    ]);

    this.players.forEach((player) => {
      player.cards = [];

      this.giveCardsToPlayer(player, 7);
    });

    let firstCard = this.popTopCard();

    while (firstCard.isWild) {
      // put at back of the pile
      this.cardsRemaining.push(firstCard);
      firstCard = this.popTopCard();
    }

    this.cardsPlayed = [];
    this.cardsPlayed.unshift(firstCard);

    this.currentPlayer = getRandomElement(this.players);
    this.winningPlayer = null;
  }

  serialize(): SerializedGame {
    return {
      id: this.id,
      lastCardPlayed: this.lastCardPlayed?.serialize() ?? null,
      players: this.players.map((player) => player.serialize(this.currentPlayer, this.hostPlayer, this.winningPlayer)),
      playing: this.playing
    };
  }

  start() {
    this.playing = true;

    this.reset();
    this.refreshClients();
  }

  takeCard(player: Player) {
    player.cards.push(this.popTopCard());
    this.currentPlayer = this.players[this.wrapPlayerIndex(this.players.indexOf(player) + this.nextPlayerIndexDiff)];
    this.refreshClients();
  }

  wrapPlayerIndex(index: number) {
    if (index >= this.players.length) {
      return 0;
    }

    if (index < 0) {
      return this.players.length - 1;
    }

    return index;
  }
}

class SocketServer {
  private gamesById = new Map<string, Game>();
  private gamesBySocket = new Map<Socket, Game>();

  constructor() {
    const app = express();
    app.use(express.static('frontend/dist'));

    const port = parseInt(PORT ?? '', 10) || 8080;
    const server = createServer(app);
    const io = new Server(server);

    io.on('connection', (socket) => {
      console.log('connection', {
        id: socket.id,
        remoteAddress: socket.conn.remoteAddress
      });

      socket.on('disconnect', () => {
        const game = this.gamesBySocket.get(socket);
        console.log('disconnect', {
          id: socket.id,
          inGame: !!game
        });
        if (!game) {
          return;
        }

        game.removePlayer(socket);
        this.gamesBySocket.delete(socket);

        if (game.destroyed) {
          this.gamesById.delete(game.id);
        }
      });

      const registerFeature = (name: string, callback: (data: Record<string, unknown>, respond: (success: boolean, data?: Record<string, unknown>) => void) => void) => {
        socket.on(name, (data, respond) => {
          if (!isPlainObject(data) || typeof callback !== 'function') {
            console.log('ignoring socket message', {
              name,
              data,
              callback
            });
            return;
          }

          console.log('handling socket message', {
            name,
            data
          });

          callback(data, respond);
        });
      };

      registerFeature('game_create', (data, respond) => {
        let id;
        while (!id || Array.from(this.gamesById.keys()).includes(id)) {
          id = Game.generateId();
        }

        const game = new Game(id, io);
        this.gamesById.set(id, game);
        respond(true, {
          id
        });
      });

      registerFeature('game_join', async ({ id, name }, respond) => {
        if (typeof id !== 'string' || typeof name !== 'string') {
          respond(false, {
            reason: FailureReason.PARAMS
          });
          return;
        }

        const game = this.gamesById.get(id);

        if (this.gamesBySocket.has(socket)) {
          respond(false, {
            reason: FailureReason.ALREADY_IN_GAME
          });
          return;
        }

        if (!game) {
          respond(false, {
            reason: FailureReason.GAME_NOT_FOUND
          });
          return;
        }

        if (game.playing) {
          respond(false, {
            reason: FailureReason.GAME_STARTED
          });
          return;
        }

        if (game.players.length === MAX_PLAYERS) {
          respond(false, {
            reason: FailureReason.GAME_FULL
          });
          return;
        }

        if (!name || name.length > MAX_NAME_LENGTH) {
          respond(false, {
            reason: FailureReason.NAME_INVALID
          });
          return;
        }

        const lowercaseName = name.toLowerCase();
        if (game.players.some((player) => player.name.toLowerCase() === lowercaseName)) {
          respond(false, {
            reason: FailureReason.NAME_TAKEN
          });
          return;
        }

        const player = new Player(name.trim(), socket);
        game.addPlayer(player);
        game.refreshClients();
        this.gamesBySocket.set(socket, game);
        respond(true);
      });

      registerFeature('game_start', (data, respond) => {
        const game = this.gamesBySocket.get(socket);

        if (!game) {
          respond(false, {
            reason: FailureReason.NOT_IN_GAME
          });
          return;
        }

        if (game.hostPlayer !== game.playersBySocket.get(socket)) {
          respond(false, {
            reason: FailureReason.PLAYER_NOT_HOST
          });
          return;
        }

        if (game.players.length < MIN_PLAYERS) {
          respond(false, {
            reason: FailureReason.GAME_EMPTY
          });
          return;
        }

        if (game.playing) {
          respond(false, {
            reason: FailureReason.GAME_STARTED
          });
          return;
        }

        game.start();
        respond(true);
      });

      registerFeature('game_play_card', ({ colour, type }, respond) => {
        if (!ALL_TYPES.includes(type as CardType) || !COLOURS.includes(colour as Colour)) {
          respond(false, {
            reason: FailureReason.PARAMS
          });
          return;
        }

        const game = this.gamesBySocket.get(socket);

        if (!game) {
          respond(false, {
            reason: FailureReason.NOT_IN_GAME
          });
          return;
        }

        if (!game.playing) {
          respond(false, {
            reason: FailureReason.GAME_NOT_STARTED
          });
          return;
        }

        const player = game.playersBySocket.get(socket) as Player;

        if (game.currentPlayer !== player) {
          respond(false, {
            reason: FailureReason.NOT_PLAYER_TURN
          });
          return;
        }

        const matchingCard = player.cards.find((card) => WILDS.includes(type as Wild) ? card.type === type : card.colour === colour && card.type === type);

        if (!matchingCard) {
          respond(false, {
            reason: FailureReason.PLAYER_MISSING_CARD
          });
          return;
        }

        if (
          !(matchingCard.isColour && (matchingCard.colour === game.lastCardPlayed?.colour || matchingCard.type === game.lastCardPlayed?.type)
          || matchingCard.isWild)
        ) {
          respond(false, {
            reason: FailureReason.CARD_NOT_PLAYABLE
          });
          return;
        }

        if (matchingCard.isWild) {
          matchingCard.colour = colour as Colour;
        }

        game.playCard(player, matchingCard);
        respond(true);
      });

      registerFeature('game_take_card', (data, respond) => {
        const game = this.gamesBySocket.get(socket);

        if (!game) {
          respond(false, {
            reason: FailureReason.NOT_IN_GAME
          });
          return;
        }

        if (!game.playing) {
          respond(false, {
            reason: FailureReason.GAME_NOT_STARTED
          });
          return;
        }

        const player = game.playersBySocket.get(socket) as Player;

        if (game.currentPlayer !== player) {
          respond(false, {
            reason: FailureReason.NOT_PLAYER_TURN
          });
          return;
        }

        game.takeCard(player);
        respond(true);
      });

      registerFeature('game_leave', (data, respond) => {
        const game = this.gamesBySocket.get(socket);

        if (!game) {
          respond(false, {
            reason: FailureReason.NOT_IN_GAME
          });
          return;
        }

        game.removePlayer(socket);
        this.gamesBySocket.delete(socket);
        respond(true);
      });
    });

    server.listen(port, () => {
      console.log('listening', {
        port: (server.address() as AddressInfo).port
      });
    });
  }
}

new SocketServer();
