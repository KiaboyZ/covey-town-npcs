import Phaser from 'phaser';
import React, {useEffect, useMemo, useState} from 'react';
import BoundingBox from '../../classes/BoundingBox';
import ConversationArea from '../../classes/ConversationArea';
import Player, {ServerPlayer, UserLocation} from '../../classes/Player';
import Video from '../../classes/Video/Video';
import useConversationAreas from '../../hooks/useConversationAreas';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import usePlayerMovement from '../../hooks/usePlayerMovement';
import usePlayersInTown from '../../hooks/usePlayersInTown';
import SocialSidebar from '../SocialSidebar/SocialSidebar';
import {Callback} from '../VideoCall/VideoFrontend/types';
import NewConversationModal from './NewCoversationModal';
import NPC, {ServerNPC} from '../../classes/NPC';
import useNPCsInTown from '../../hooks/useNPCsInTown';
import useNPCMovement from "../../hooks/useNPCMovement";

// Original inspiration and code from:
// https://medium.com/@michaelwesthadley/modular-game-worlds-in-phaser-3-tilemaps-1-958fc7e6bbd6

type ConversationGameObjects = {
  labelText: Phaser.GameObjects.Text;
  topicText: Phaser.GameObjects.Text;
  sprite: Phaser.GameObjects.Sprite;
  label: string;
  conversationArea?: ConversationArea;
};

class CoveyGameScene extends Phaser.Scene {
  private player?: {
    sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    label: Phaser.GameObjects.Text;
  };

  private myPlayerID: string;

  private players: Player[] = [];

  private npcs: NPC[] = [];

  private npcSpriteStrings: Map<string, string> = new Map();

  private conversationAreas: ConversationGameObjects[] = [];

  private cursors: Phaser.Types.Input.Keyboard.CursorKeys[] = [];

  /*
   * A "captured" key doesn't send events to the browser - they are trapped by Phaser
   * When pausing the game, we uncapture all keys, and when resuming, we re-capture them.
   * This is the list of keys that are currently captured by Phaser.
   */
  private previouslyCapturedKeys: number[] = [];

  private lastLocation?: UserLocation;

  private ready = false;

  private paused = false;

  private video: Video;

  private emitMovement: (loc: UserLocation) => void;

  private currentConversationArea?: ConversationGameObjects;

  private infoTextBox?: Phaser.GameObjects.Text;

  private setNewConversation: (conv: ConversationArea) => void;

  private _onGameReadyListeners: Callback[] = [];

  private mapLayers: Phaser.Tilemaps.TilemapLayer[] = [];

  constructor(
    video: Video,
    emitMovement: (loc: UserLocation) => void,
    setNewConversation: (conv: ConversationArea) => void,
    myPlayerID: string,
  ) {
    super('PlayGame');
    this.video = video;
    this.emitMovement = emitMovement;
    this.myPlayerID = myPlayerID;
    this.setNewConversation = setNewConversation;
  }

  preload() {
    // this.load.image("logo", logoImg);
    this.load.image('Room_Builder_32x32', '/assets/tilesets/Room_Builder_32x32.png');
    this.load.image('22_Museum_32x32', '/assets/tilesets/22_Museum_32x32.png');
    this.load.image(
      '5_Classroom_and_library_32x32',
      '/assets/tilesets/5_Classroom_and_library_32x32.png',
    );
    this.load.image('12_Kitchen_32x32', '/assets/tilesets/12_Kitchen_32x32.png');
    this.load.image('1_Generic_32x32', '/assets/tilesets/1_Generic_32x32.png');
    this.load.image('13_Conference_Hall_32x32', '/assets/tilesets/13_Conference_Hall_32x32.png');
    this.load.image('14_Basement_32x32', '/assets/tilesets/14_Basement_32x32.png');
    this.load.image('16_Grocery_store_32x32', '/assets/tilesets/16_Grocery_store_32x32.png');
    this.load.tilemapTiledJSON('map', '/assets/tilemaps/indoors.json');
    this.load.atlas('atlas', '/assets/atlas/atlas.png', '/assets/atlas/atlas.json');
  }

  /**
   * Update the WorldMap's view of the current conversation areas, updating their topics and
   * participants, as necessary
   *
   * @param conversationAreas
   * @returns
   */
  updateConversationAreas(conversationAreas: ConversationArea[]) {
    if (!this.ready) {
      /*
       * Due to the asynchronous nature of setting up a Phaser game scene (it requires gathering
       * some resources using asynchronous operations), it is possible that this could be called
       * in the period between when the player logs in and when the game is ready. Hence, we
       * register a callback to complete the initialization once the game is ready
       */
      this._onGameReadyListeners.push(() => {
        this.updateConversationAreas(conversationAreas);
      });
      return;
    }
    conversationAreas.forEach(eachNewArea => {
      const existingArea = this.conversationAreas.find(area => area.label === eachNewArea.label);
      // TODO - if it becomes necessary to support new conversation areas (dynamically created), need to create sprites here to enable rendering on phaser
      // assert(existingArea);
      if (existingArea) {
        // assert(!existingArea.conversationArea);
        existingArea.conversationArea = eachNewArea;
        const updateListener = {
          onTopicChange: (newTopic: string | undefined) => {
            if (newTopic) {
              existingArea.topicText.text = newTopic;
            } else {
              existingArea.topicText.text = '(No topic)';
            }
          },
        };
        eachNewArea.addListener(updateListener);
        updateListener.onTopicChange(eachNewArea.topic);
      }
    });
    this.conversationAreas.forEach(eachArea => {
      const serverArea = conversationAreas?.find(a => a.label === eachArea.label);
      if (!serverArea) {
        eachArea.conversationArea = undefined;
      }
    });
  }

  createSpeechBubble (x: number, y: number, width: number, height: number, quote: string)
  {
    const bubbleWidth = width;
    const bubbleHeight = height;
    const bubblePadding = 10;
    const arrowHeight = bubbleHeight / 4;

    const bubble = this.add.graphics({ x, y });
    bubble.setDepth(100);
    //  Bubble shadow
    bubble.fillStyle(0x222222, 0.5);
    bubble.fillRoundedRect(6, 6, bubbleWidth, bubbleHeight, 16);

    //  Bubble color
    bubble.fillStyle(0xffffff, 1);

    //  Bubble outline line style
    bubble.lineStyle(4, 0x565656, 1);

    //  Bubble shape and outline
    bubble.strokeRoundedRect(0, 0, bubbleWidth, bubbleHeight, 16);
    bubble.fillRoundedRect(0, 0, bubbleWidth, bubbleHeight, 16);

    //  Calculate arrow coordinates
    const point1X = Math.floor(bubbleWidth / 7);
    const point1Y = bubbleHeight;
    const point2X = Math.floor((bubbleWidth / 7) * 2);
    const point2Y = bubbleHeight;
    const point3X = Math.floor(bubbleWidth / 7);
    const point3Y = Math.floor(bubbleHeight + arrowHeight);

    //  Bubble arrow shadow
    bubble.lineStyle(4, 0x222222, 0.5);
    bubble.lineBetween(point2X - 1, point2Y + 6, point3X + 2, point3Y);

    //  Bubble arrow fill
    bubble.fillTriangle(point1X, point1Y, point2X, point2Y, point3X, point3Y);
    bubble.lineStyle(2, 0x565656, 1);
    bubble.lineBetween(point2X, point2Y, point3X, point3Y);
    bubble.lineBetween(point1X, point1Y, point3X, point3Y);

    const content = this.add.text(0, 0, quote, {
      fontFamily: 'Arial',
      fontSize: "20",
      color: '#000000',
      align: 'center',
      wordWrap: { width: bubbleWidth - (bubblePadding * 2) }
    });

    const b = content.getBounds();

    content.setPosition(bubble.x + (bubbleWidth / 2) - (b.width / 2), bubble.y + (bubbleHeight / 2) - (b.height / 2));
    content.setDepth(101);
    return {text: content, bubble};
  }

  async updateNPCLocation(npc: NPC) {
    let myNPC = this.npcs.find(c => c.id === npc.id);
    if (!myNPC) {
      myNPC = new NPC(npc.id, npc.name, npc.startLocation, npc.currentLocation, npc.behavior, npc.spriteImage, npc.spriteJSON);
      this.npcs.push(myNPC);
    }
    if (this.physics) {
      let { phaserSprite } = myNPC;
      const { name, currentLocation, startLocation, behavior: {script}, spriteImage, spriteJSON } = myNPC;

      // Check if the sprite exists or has changed
      if (!phaserSprite || this.npcSpriteStrings.get(myNPC.name) !== myNPC.spriteImage) {
        const atlasKey = `${name}-atlas`;
        const directions = ["left", "right", "front", "back"];

        // If the last sprite is still going, stop it
        if (this.npcSpriteStrings.get(myNPC.name) !== myNPC.spriteImage && myNPC.phaserSprite) {
          myNPC.phaserSprite.anims.stop();
          myNPC.phaserSprite.destroy();
          // directions.map((direction) => this.anims.remove(`${name}-${direction}-walk`))
          // this.textures.remove(atlasKey);
        }

        // Set the image string, so we can tell if it has changed
        this.npcSpriteStrings.set(myNPC.name, spriteImage);

        // Convert the base64 image string into an image object
        let spriteSheetImg: HTMLImageElement;
        await (async () => {
          spriteSheetImg = new Image();
          spriteSheetImg.src = spriteImage;
          await spriteSheetImg.decode()
        })();

        if (!this.textures.exists(atlasKey)) {
          // Wait for the sprite-sheet to load as a texture
          await new Promise<void>((resolve) => {
            this.textures.once('addtexture', () => {
              resolve();
            });
            this.textures.addAtlasJSONHash(atlasKey, spriteSheetImg,  JSON.parse(spriteJSON));
          });
        }

        // Create all the animations for the given character from the texture
        const {anims} = this;
        await Promise.all(directions.map((direction) => new Promise<void>((resolve, reject) => {
            this.anims.once('add', () => {
              resolve();
            });
            const result = anims.create({
              key: `${name}-${direction}-walk`,
              frames: anims.generateFrameNames(atlasKey, {
                prefix: `${name}_${direction}_walk.`,
                start: 0,
                end: 3,
                zeroPad: 3,
                suffix: ".png"
              }),
              frameRate: 10,
              repeat: -1,
            });

            if(!result)
            {
              reject();
            }
          })
        ));

        // Create the sprite and place it correctly
        phaserSprite = this.physics.add
          .sprite(startLocation.x, startLocation.y, atlasKey,`${name}_front.png`)
          .setSize(32, 40)
          .setOffset(0, 24);
        myNPC.phaserSprite = phaserSprite;

        // Add physics collisions for the npcs and the walls
        for (let i = 0; i < this.mapLayers.length; i+=1) {
          this.physics.add.collider(phaserSprite, this.mapLayers[i])
        }
        // Also make the player collide with them
        if (this.player) {
          this.physics.add.collider(phaserSprite, this.player.sprite)
        }
      }

      if(myNPC.phaserSprite) {
        // See which direction the NPC is heading and animate them if they are moving
        const xDiff = (phaserSprite.x - currentLocation.x);
        const yDiff = (phaserSprite.y - currentLocation.y);
        let rotation = "";
        if (Math.abs(xDiff) < 3 && Math.abs(yDiff) < 3) {
          phaserSprite.anims.stop();
          phaserSprite.setTexture(`${myNPC.name}-atlas`, `${myNPC.name}_${npc.currentLocation.rotation}.png`);
        }
        else {
          if (Math.abs(xDiff) > Math.abs(yDiff)) {
            rotation = xDiff < 0 ? 'right' : 'left';
          } else {
            rotation = yDiff < 0 ? 'front' : 'back';
          }
          // console.log(`playing animation ${myNPC.name}`)
          this.anims.play(`${myNPC.name}-${rotation}-walk`, myNPC.phaserSprite);
        }
      }

      // Create the label if it doesn't exist
      if (!myNPC.label) {
        // Add the NPC's label
        myNPC.label = this.add.text(0, 0, myNPC.name, {
          font: '18px monospace',
          color: '#000000',
          backgroundColor: '#ffffff',
        });
        myNPC.label.setDepth(50);
      } else if (myNPC.label.text !== myNPC.name) {
        // Update the NPC's label if necessary
        myNPC.label.setText(myNPC.name);
      }

      // Create all the text bubbles if they don't exist
      if (!myNPC.textBoxes) {
        myNPC.textBoxes = script.scriptLines.map((line) => {
          const result = this.createSpeechBubble(npc.currentLocation.x, npc.currentLocation.y, 100, 50, line);
          result.text.setVisible(false);
          result.bubble.setVisible(false);
          return {text: result.text, bubble: result.bubble};
        })
      }

      // Keep track of how often we are getting updates from the server to accurately move
      const time = performance.now();
      myNPC.avgTimePerUpdate = (time - myNPC.timeLastUpdated + myNPC.avgTimePerUpdate) / 2 ;
      myNPC.timeLastUpdated = time;
    }
  }

  updateNPCLocations(npcs: NPC[]) {
    if (!this.ready) {
      this.npcs = npcs;
      return;
    }

    npcs.forEach(npc => {
      this.updateNPCLocation(npc);
    });

    const disconnectedNPCs = this.npcs.filter(
      npc => !npcs.find(p => p.id === npc.id),
    );

    disconnectedNPCs.forEach(disconnectedNPC => {
      if (disconnectedNPC.phaserSprite) {
        disconnectedNPC.phaserSprite.destroy();
      }
    });

    // Remove disconnected NPCs from list
    if (disconnectedNPCs.length) {
      this.npcs = this.npcs.filter(
        npc => !disconnectedNPCs.find(p => p.id === npc.id),
      );
    }

  }

  updatePlayersLocations(players: Player[]) {
    if (!this.ready) {
      this.players = players;
      return;
    }
    players.forEach(p => {
      this.updatePlayerLocation(p);
    });
    // Remove disconnected players from board
    const disconnectedPlayers = this.players.filter(
      player => !players.find(p => p.id === player.id),
    );
    disconnectedPlayers.forEach(disconnectedPlayer => {
      if (disconnectedPlayer.sprite) {
        disconnectedPlayer.sprite.destroy();
        disconnectedPlayer.label?.destroy();
      }
    });
    // Remove disconnected players from list
    if (disconnectedPlayers.length) {
      this.players = this.players.filter(
        player => !disconnectedPlayers.find(p => p.id === player.id),
      );
    }
  }

  updatePlayerLocation(player: Player) {
    let myPlayer = this.players.find(p => p.id === player.id);
    if (!myPlayer) {
      let { location } = player;
      if (!location) {
        location = {
          rotation: 'back',
          moving: false,
          x: 0,
          y: 0,
        };
      }
      myPlayer = new Player(player.id, player.userName, location);
      this.players.push(myPlayer);
    }
    if (this.myPlayerID !== myPlayer.id && this.physics && player.location) {
      let { sprite } = myPlayer;
      if (!sprite) {
        sprite = this.physics.add
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - JB todo
          .sprite(0, 0, 'atlas', 'misa-front')
          .setSize(30, 40)
          .setOffset(0, 24);
        const label = this.add.text(0, 0, myPlayer.userName, {
          font: '18px monospace',
          color: '#000000',
          backgroundColor: '#ffffff',
        });
        myPlayer.label = label;
        myPlayer.sprite = sprite;
      }
      if (!sprite.anims) return;
      sprite.setX(player.location.x);
      sprite.setY(player.location.y);
      myPlayer.label?.setX(player.location.x);
      myPlayer.label?.setY(player.location.y - 20);
      if (player.location.moving) {
        sprite.anims.play(`misa-${player.location.rotation}-walk`, true);
      } else {
        sprite.anims.stop();
        sprite.setTexture('atlas', `misa-${player.location.rotation}`);
      }
    }
  }

  getNewMovementDirection() {
    if (this.cursors.find(keySet => keySet.left?.isDown)) {
      return 'left';
    }
    if (this.cursors.find(keySet => keySet.right?.isDown)) {
      return 'right';
    }
    if (this.cursors.find(keySet => keySet.down?.isDown)) {
      return 'front';
    }
    if (this.cursors.find(keySet => keySet.up?.isDown)) {
      return 'back';
    }
    return undefined;
  }

  update() {
    if (this.paused) {
      return;
    }
    if (this.player && this.cursors) {
      const speed = 175;

      const prevVelocity = this.player.sprite.body.velocity.clone();
      const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;

      // Stop any previous movement from the last frame
      body.setVelocity(0);

      const primaryDirection = this.getNewMovementDirection();
      switch (primaryDirection) {
        case 'left':
          body.setVelocityX(-speed);
          this.player.sprite.anims.play('misa-left-walk', true);
          break;
        case 'right':
          body.setVelocityX(speed);
          this.player.sprite.anims.play('misa-right-walk', true);
          break;
        case 'front':
          body.setVelocityY(speed);
          this.player.sprite.anims.play('misa-front-walk', true);
          break;
        case 'back':
          body.setVelocityY(-speed);
          this.player.sprite.anims.play('misa-back-walk', true);
          break;
        default:
          // Not moving
          this.player.sprite.anims.stop();
          // If we were moving, pick and idle frame to use
          if (prevVelocity.x < 0) {
            this.player.sprite.setTexture('atlas', 'misa-left');
          } else if (prevVelocity.x > 0) {
            this.player.sprite.setTexture('atlas', 'misa-right');
          } else if (prevVelocity.y < 0) {
            this.player.sprite.setTexture('atlas', 'misa-back');
          } else if (prevVelocity.y > 0) this.player.sprite.setTexture('atlas', 'misa-front');
          break;
      }

      // Normalize and scale the velocity so that player can't move faster along a diagonal
      this.player.sprite.body.velocity.normalize().scale(speed);
      const isMoving = primaryDirection !== undefined;
      this.player.label.setX(body.x);
      this.player.label.setY(body.y - 20);
      if (
        !this.lastLocation ||
        this.lastLocation.x !== body.x ||
        this.lastLocation.y !== body.y ||
        (isMoving && this.lastLocation.rotation !== primaryDirection) ||
        this.lastLocation.moving !== isMoving
      ) {
        if (!this.lastLocation) {
          this.lastLocation = {
            x: body.x,
            y: body.y,
            rotation: primaryDirection || 'front',
            moving: isMoving,
          };
        }
        this.lastLocation.x = body.x;
        this.lastLocation.y = body.y;
        this.lastLocation.rotation = primaryDirection || 'front';
        this.lastLocation.moving = isMoving;
        if (this.currentConversationArea) {
          if(this.currentConversationArea.conversationArea){
            this.lastLocation.conversationLabel = this.currentConversationArea.label;
          }
          if (
            !Phaser.Geom.Rectangle.Overlaps(
              this.currentConversationArea.sprite.getBounds(),
              this.player.sprite.getBounds(),
            )
          ) {
            this.infoTextBox?.setVisible(false);
            this.currentConversationArea = undefined;
            this.lastLocation.conversationLabel = undefined;
          }
        }
        this.emitMovement(this.lastLocation);
      }

      // Figure out if the user is close to any of the NPC text-boxes and show them if activated
      const cursorKeys = this.input.keyboard.createCursorKeys();
      if (this.input.keyboard.checkDown(cursorKeys.space, 150)) {
        this.npcs.forEach(npc => {
          npc.textBoxTimeout = 250;
          npc.updateTextboxes(body)
        })
      }
    }

    this.npcs.forEach((npc) => npc.updateGraphics())
  }

  async create() {
    const map = this.make.tilemap({ key: 'map' });

    /* Parameters are the name you gave the tileset in Tiled and then the key of the
     tileset image in Phaser's cache (i.e. the name you used in preload)
     */
    const tileset = [
      'Room_Builder_32x32',
      '22_Museum_32x32',
      '5_Classroom_and_library_32x32',
      '12_Kitchen_32x32',
      '1_Generic_32x32',
      '13_Conference_Hall_32x32',
      '14_Basement_32x32',
      '16_Grocery_store_32x32',
    ].map(v => map.addTilesetImage(v));

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const belowLayer = map.createLayer('Below Player', tileset, 0, 0);
    const wallsLayer = map.createLayer('Walls', tileset, 0, 0);
    const onTheWallsLayer = map.createLayer('On The Walls', tileset, 0, 0);
    wallsLayer.setCollisionByProperty({ collides: true });
    onTheWallsLayer.setCollisionByProperty({ collides: true });

    const worldLayer = map.createLayer('World', tileset, 0, 0);
    worldLayer.setCollisionByProperty({ collides: true });
    const aboveLayer = map.createLayer('Above Player', tileset, 0, 0);
    aboveLayer.setCollisionByProperty({ collides: true });

    const veryAboveLayer = map.createLayer('Very Above Player', tileset, 0, 0);

    this.mapLayers = [wallsLayer, onTheWallsLayer, worldLayer, aboveLayer];

    /* By default, everything gets depth sorted on the screen in the order we created things.
     Here, we want the "Above Player" layer to sit on top of the player, so we explicitly give
     it a depth. Higher depths will sit on top of lower depth objects.
     */
    worldLayer.setDepth(5);
    aboveLayer.setDepth(10);
    veryAboveLayer.setDepth(15);

    // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
    // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
    const spawnPoint = (map.findObject(
      'Objects',
      obj => obj.name === 'Spawn Point',
    ) as unknown) as Phaser.GameObjects.Components.Transform;

    // Find all of the transporters, add them to the physics engine
    const transporters = map.createFromObjects('Objects', { name: 'transporter' });
    this.physics.world.enable(transporters);

    // For each of the transporters (rectangle objects), we need to tweak their location on the scene
    // for reasons that are not obvious to me, but this seems to work. We also set them to be invisible
    // but for debugging, you can comment out that line.
    transporters.forEach(transporter => {
      const sprite = transporter as Phaser.GameObjects.Sprite;
      sprite.y += sprite.displayHeight; // Phaser and Tiled seem to disagree on which corner is y
      sprite.setVisible(false); // Comment this out to see the transporter rectangles drawn on
      // the map
    });

    const conversationAreaObjects = map.filterObjects(
      'Objects',
      obj => obj.type === 'conversation',
    );
    const conversationSprites = map.createFromObjects(
      'Objects',
      conversationAreaObjects.map(obj => ({ id: obj.id })),
    );
    this.physics.world.enable(conversationSprites);
    conversationSprites.forEach(conversation => {
      const sprite = conversation as Phaser.GameObjects.Sprite;
      sprite.y += sprite.displayHeight;
      const labelText = this.add.text(
        sprite.x - sprite.displayWidth / 2,
        sprite.y - sprite.displayHeight / 2,
        conversation.name,
        { color: '#FFFFFF', backgroundColor: '#000000' },
      );
      const topicText = this.add.text(
        sprite.x - sprite.displayWidth / 2,
        sprite.y + sprite.displayHeight / 2,
        '(No Topic)',
        { color: '#000000' },
      );
      sprite.setTintFill();
      sprite.setAlpha(0.3);

      this.conversationAreas.push({
        labelText,
        topicText,
        sprite,
        label: conversation.name,
      });
    });

    this.infoTextBox = this.add
      .text(
        this.game.scale.width / 2,
        this.game.scale.height / 2,
        "You've found an empty conversation area!\nTell others what you'd like to talk about here\nby providing a topic label for the conversation.\nSpecify a topic by pressing the spacebar.",
        { color: '#000000', backgroundColor: '#FFFFFF' },
      )
      .setScrollFactor(0)
      .setDepth(30);
    this.infoTextBox.setVisible(false);
    this.infoTextBox.x = this.game.scale.width / 2 - this.infoTextBox.width / 2;

    const labels = map.filterObjects('Objects', obj => obj.name === 'label');
    labels.forEach(label => {
      if (label.x && label.y) {
        this.add.text(label.x, label.y, label.text.text, {
          color: '#FFFFFF',
          backgroundColor: '#000000',
        });
      }
    });

    const cursorKeys = this.input.keyboard.createCursorKeys();
    this.cursors.push(cursorKeys);
    this.cursors.push(
      this.input.keyboard.addKeys(
        {
          up: Phaser.Input.Keyboard.KeyCodes.W,
          down: Phaser.Input.Keyboard.KeyCodes.S,
          left: Phaser.Input.Keyboard.KeyCodes.A,
          right: Phaser.Input.Keyboard.KeyCodes.D,
        },
        false,
      ) as Phaser.Types.Input.Keyboard.CursorKeys,
    );
    this.cursors.push(
      this.input.keyboard.addKeys(
        {
          up: Phaser.Input.Keyboard.KeyCodes.H,
          down: Phaser.Input.Keyboard.KeyCodes.J,
          left: Phaser.Input.Keyboard.KeyCodes.K,
          right: Phaser.Input.Keyboard.KeyCodes.L,
        },
        false,
      ) as Phaser.Types.Input.Keyboard.CursorKeys,
    );

    // Create a sprite with physics enabled via the physics system. The image used for the sprite
    // has a bit of whitespace, so I'm using setSize & setOffset to control the size of the
    // player's body.
    const sprite = this.physics.add
      .sprite(spawnPoint.x, spawnPoint.y, 'atlas', 'misa-front')
      .setSize(30, 40)
      .setOffset(0, 24);
    const label = this.add.text(spawnPoint.x, spawnPoint.y - 20, '(You)', {
      font: '18px monospace',
      color: '#000000',
      // padding: {x: 20, y: 10},
      backgroundColor: '#ffffff',
    });
    this.player = {
      sprite,
      label,
    };

    /* Configure physics overlap behavior for when the player steps into
    a transporter area. If you enter a transporter and press 'space', you'll
    transport to the location on the map that is referenced by the 'target' property
    of the transporter.
     */
    this.physics.add.overlap(sprite, transporters, (overlappingObject, transporter) => {
      if (this.player) {
        // In the tiled editor, set the 'target' to be an *object* pointer
        // Here, we'll see just the ID, then find the object by ID
        const transportTargetID = transporter.getData('target') as number;
        const target = map.findObject(
          'Objects',
          obj => ((obj as unknown) as Phaser.Types.Tilemaps.TiledObject).id === transportTargetID,
        );
        if (target && target.x && target.y && this.lastLocation) {
          // Move the player to the target, update lastLocation and send it to other players
          this.player.sprite.x = target.x;
          this.player.sprite.y = target.y;
          this.lastLocation.x = target.x;
          this.lastLocation.y = target.y;
          this.emitMovement(this.lastLocation);
        } else {
          throw new Error(`Unable to find target object ${target}`);
        }
      }
    });
    this.physics.add.overlap(
      sprite,
      conversationSprites,
      (overlappingPlayer, conversationSprite) => {
        const conversationLabel = conversationSprite.name;
        const conv = this.conversationAreas.find(area => area.label === conversationLabel);
        this.currentConversationArea = conv;
        if (conv?.conversationArea) {
          this.infoTextBox?.setVisible(false);
          const localLastLocation = this.lastLocation;
          if(localLastLocation && localLastLocation.conversationLabel !== conv.conversationArea.label){
            localLastLocation.conversationLabel = conv.conversationArea.label;
            this.emitMovement(localLastLocation);
          }
        } else {
          if (cursorKeys.space.isDown) {
            const newConversation = new ConversationArea(
              conversationLabel,
              BoundingBox.fromSprite(conversationSprite as Phaser.GameObjects.Sprite),
            );
            this.setNewConversation(newConversation);
          }
          this.infoTextBox?.setVisible(true);
        }
      },
    );

    this.emitMovement({
      rotation: 'front',
      moving: false,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - JB todo
      x: spawnPoint.x,
      y: spawnPoint.y,
    });

    // Watch the player and worldLayer for collisions, for the duration of the scene:
    this.physics.add.collider(sprite, worldLayer);
    this.physics.add.collider(sprite, wallsLayer);
    this.physics.add.collider(sprite, aboveLayer);
    this.physics.add.collider(sprite, onTheWallsLayer);

    // Create the player's walking animations from the texture atlas. These are stored in the global
    // animation manager so any sprite can access them.
    const { anims } = this;
    const directions = ["left", "right", "front", "back"];


    await Promise.all(directions.map((direction) => new Promise<void>((resolve) => {
      this.anims.once('add', () => {
        resolve();
      })
      anims.create({
        key: `misa-${direction}-walk`,
        frames: anims.generateFrameNames('atlas', {
          prefix: `misa-${direction}-walk.`,
          start: 0,
          end: 3,
          zeroPad: 3,
        }),
        frameRate: 10,
        repeat: -1,
      })
    })))

    const camera = this.cameras.main;
    camera.startFollow(this.player.sprite);
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Help text that has a "fixed" position on the screen
    this.add
      .text(
        16,
        16,
        `Arrow keys to move`,
        {
          font: '18px monospace',
          color: '#000000',
          padding: {
            x: 20,
            y: 10,
          },
          backgroundColor: '#ffffff',
        },
      )
      .setScrollFactor(0)
      .setDepth(30);

    this.ready = true;
    if (this.players.length) {
      // Some players got added to the queue before we were ready, make sure that they have
      // sprites....
      this.players.forEach(p => this.updatePlayerLocation(p));
    }
    if (this.npcs.length) {
      this.npcs.forEach((npc) => {
        this.updateNPCLocation(npc);
      })
    }

    // Call any listeners that are waiting for the game to be initialized
    this._onGameReadyListeners.forEach(listener => listener());
    this._onGameReadyListeners = [];
  }

  pause() {
    if (!this.paused) {
      this.paused = true;
      if(this.player){
        this.player?.sprite.anims.stop();
        const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0);
      }
      this.previouslyCapturedKeys = this.input.keyboard.getCaptures();
      this.input.keyboard.clearCaptures();
    }
  }

  resume() {
    if (this.paused) {
      this.paused = false;
      if (Video.instance()) {
        // If the game is also in process of being torn down, the keyboard could be undefined
        this.input.keyboard.addCapture(this.previouslyCapturedKeys);
      }
      this.previouslyCapturedKeys = [];
    }
  }
}

export default function WorldMap(): JSX.Element {
  const video = Video.instance();
  const { emitMovement, myPlayerID } = useCoveyAppState();
  const conversationAreas = useConversationAreas();
  const [gameScene, setGameScene] = useState<CoveyGameScene>();
  const [newConversation, setNewConversation] = useState<ConversationArea>();
  const playerMovementCallbacks = usePlayerMovement();
  const npcMovementCallbacks = useNPCMovement();
  const players = usePlayersInTown();
  const npcs = useNPCsInTown();

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      backgroundColor: '#000000',
      parent: 'map-container',
      pixelArt: true,
      autoRound: 10,
      minWidth: 800,
      fps: { target: 30 },
      powerPreference: 'high-performance',
      minHeight: 600,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 }, // Top down game, so no gravity
        },
      },
    };

    const game = new Phaser.Game(config);
    if (video) {
      const newGameScene = new CoveyGameScene(video, emitMovement, setNewConversation, myPlayerID);
      setGameScene(newGameScene);
      game.scene.add('coveyBoard', newGameScene, true);
      video.pauseGame = () => {
        newGameScene.pause();
      };
      video.unPauseGame = () => {
        newGameScene.resume();
      };
    }
    return () => {
      game.destroy(true);
    };
  }, [video, emitMovement, setNewConversation, myPlayerID]);

  useEffect(() => {
    const movementDispatcher = (player: ServerPlayer) => {
      gameScene?.updatePlayerLocation(Player.fromServerPlayer(player));
    };
    playerMovementCallbacks.push(movementDispatcher);
    return () => {
      playerMovementCallbacks.splice(playerMovementCallbacks.indexOf(movementDispatcher), 1);
    };
  }, [gameScene, playerMovementCallbacks]);

  useEffect(() => {
    const movementDispatcher = (npc: ServerNPC) => {
      gameScene?.updateNPCLocation(NPC.fromServerNPC(npc));
    };
    npcMovementCallbacks.push(movementDispatcher);
    return () => {
      npcMovementCallbacks.splice(npcMovementCallbacks.indexOf(movementDispatcher), 1);
    };
  }, [gameScene, npcMovementCallbacks]);

  useEffect(() => {
    gameScene?.updatePlayersLocations(players);
  }, [gameScene, players]);

  useEffect(() => {
    gameScene?.updateConversationAreas(conversationAreas);
  }, [conversationAreas, gameScene]);

  useEffect(() => {
    gameScene?.updateNPCLocations(npcs);
  }, [npcs, gameScene]);

  const newConversationModalOpen = newConversation !== undefined;
  useEffect(() => {
    if (newConversationModalOpen) {
      video?.pauseGame();
    } else {
      video?.unPauseGame();
    }
  }, [video, newConversationModalOpen]);

  const newConversationModal = useMemo(() => {
    if (newConversation) {
      video?.pauseGame();
      return (
        <NewConversationModal
          isOpen={newConversation !== undefined}
          closeModal={() => {
            video?.unPauseGame();
            setNewConversation(undefined);
          }}
          newConversation={newConversation}
        />
      );
    }
    return <></>;
  }, [video, newConversation, setNewConversation]);

  return (
    <div id='app-container'>
      {newConversationModal}
      <div id='map-container' />
      <div id='social-container'>
        <SocialSidebar />
      </div>
    </div>
  );
}
