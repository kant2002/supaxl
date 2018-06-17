import { dContainer, pContainer, asprite, sprite } from './asprite';
import { key2pos, pos2key, allPos } from './util';


function tFrame(textures, tile) {
  let frame = frames[tile.role];

  if (!frame) {
    return 'reddisk';
  } else {
    if (typeof frame === "string") {
      return frame;
    } else {
      return frame(tile);
    }
  }
}

function tTextures(textures, tile) {
  let frame = tFrame(textures, tile);

  let texture = textures[frame];
  let duration = durations[frame] || 1000;

  if (!texture) {
    throw 'no texture for tile ' + tile;
  }

  return {
    texture,
    duration
  };
}

const durations = {
  "sci-up": 240,
  "sci-down": 240,
  "sci-left": 240,
  "sci-right": 240,
  "zonk-roll-right": 200,
  "zonk-roll-left": 200,
  "info-roll-right": 600,
  "info-roll-left": 600,
  infoVanish: 240,
  infoExplode: 200,
  explode: 200,
  diskVanish: 200,
  redTerminalOn: 2000,
  greenTerminalOn: 2000,
  baseVanish: 1000,
  baseBug: 1000,
  electron: 240,
  murphyYawn: 1000,
  murphyYawn2: 1000,
  "murphy-right": 240,
  "murphy-left": 240,
  "murphyVanish": 1000
};

const frames = {
    SNIKSNAK: (tile) => {
    return tile.moving > 0 ?
        ['sci', tile.facing].join('-'):
        ['sci', tile.facing, tile.preFace].join('-');
  },
  ZONK: (tile) => {
    if (tile.rolling > 0) {
      const hanged = tile.rolling === 3?'hanged-':'';
      return hanged + ['zonk', 'roll', tile.facing].join('-');
    }
    return 'zonk';
  },
  INFOTRON: (tile) => {
    if (tile.rolling > 0) {
      const hanged = tile.rolling === 3?'hanged-':'';
      return hanged + ['info', 'roll', tile.facing].join('-');
    }
    if (tile.vanishing > 0) {
      return 'infoVanish';
    }
    return 'infotron';
  },
  BASE: (tile) => {
    if (tile.vanishing > 0) {
      return 'baseVanish';
    }
    return 'base';
  },
  BUG: (tile) => {
    return tile.active > 0 ? `baseBug`:'base';
  },
  MURPHY: (tile) => {
    if (tile.pushing > 0) {
      return ['murphy', 'push', tile.facing].join('-');
    } else if (tile.moving > 0) {
      return ['murphy', tile.facingHorizontal].join('-');
    } else if (tile.snapping > 0) {
      return ['murphy', 'snap', tile.facing].join('-');
    }
    return 'murphy';
  },
  TERMINAL: (tile) => {
    return 'greenTerminalOn';
  },
  EMPTY: 'empty',
  EXIT: 'exit',
  WALL: 'wall',
  EXPLOSION: 'explosion',
  FLOPPY_RED: 'reddisk',
  FLOPPY_ORANGE: 'orangedisk',
  FLOPPY_YELLOW: 'yellowdisk',
  CHIP: 'chip',
  CHIP_TOP: 'chipTop',
  CHIP_BOTTOM: 'chipBottom',
  CHIP_LEFT: 'chipLeft',
  CHIP_RIGHT: 'chipRight',
  HARDWARE1: 'hardware1',
  HARDWARE2: 'hardware2',
  HARDWARE3: 'hardware3',
  HARDWARE4: 'hardware4',
  HARDWARE5: 'hardware5',
  HARDWARE6: 'hardware6',
  HARDWARE7: 'hardware7',
  HARDWARE8: 'hardware8',
  HARDWARE9: 'hardware9',
  HARDWARE10: 'hardware10',
  ELECTRON: 'electron',
  PORT_ALL: 'portAll',
  PORT_UP: 'portUp',
  PORT_DOWN: 'portDown',
  PORT_LEFT: 'portLeft',
  PORT_RIGHT: 'portRight',
  GPORT_UP: 'portUp',
  GPORT_DOWN: 'portDown',
  GPORT_LEFT: 'portLeft',
  GPORT_RIGHT: 'portRight',
  PORT_HORIZONTAL: 'portHorizontal',
  PORT_VERTICAL: 'portVertical'
};

export function renderWrap(ctrl, app, textures) {
  const container = pContainer();
  app.stage.addChild(container);
  const borderContainer = bContainer(textures);
  app.stage.addChild(borderContainer);



  const portMurphy = asprite(textures['murphy-left']);
  container.addChild(portMurphy);


  borderContainer.position.set(-16, -16);

  const { tiles, measure } =  ctrl.data;

  const sprites = [];
  const lastByTile = {};

  allPos.forEach((pos) => {
    let offset = measure.offset,
        tilePos = [pos[0] + offset[0],
                   pos[1] + offset[1]];
    
    let tileKey = pos2key(tilePos);

    let tile = tiles[tileKey],
        { texture,
          duration } = tTextures(textures, tile),
        sprite = asprite(texture, duration);

    sprites[pos2key(pos)] = sprite;

    sprite.position.set(pos[0] * 32,
                        pos[1] * 32);

    lastByTile[tileKey] = sprite.lastTime;

    container.addChild(sprite);

  });

  let cOffset = -64;
  // 
  cOffset = 0;

  return () => {
    let { offset, edgeOffset } = measure;

    if (edgeOffset) {
      container.position.set(cOffset + edgeOffset[0] * 32,
                             cOffset + edgeOffset[1] * 32);
    }

    let viewTween = ctrl.data.viewTween,
        edgeTween = ctrl.data.edgeTween;

    if (edgeTween) {
      container.position.set(
        container.position.x - edgeTween[1][0],
        container.position.y - edgeTween[1][1]);
    }


    {
      portMurphy.alpha = 0;
    }

    allPos.forEach((pos) => {
      let tilePos = [pos[0] + offset[0],
                     pos[1] + offset[1]];

      let tileKey = pos2key(tilePos);

      let tile = tiles[tileKey],
          sprite = sprites[pos2key(pos)];

      let { texture,
            duration } = tTextures(textures, tile);

      let newTexture =
      sprite.setTextures(texture, duration, lastByTile[tileKey]);

      sprite.position.set(pos[0] * 32,
                          pos[1] * 32);

      let tween = ctrl.data.tweens[tileKey];

      if (tween) {
        sprite.position.set(
          sprite.position.x + tween[1][0],
          sprite.position.y + tween[1][1]);
      }

      if (tile.isTrail) {
        container.setChildIndex(sprite, 0);
      }

      if (tile.porting) {
        // workaround to set z index
        container.setChildIndex(sprite, container.children.length - 1);
      let { texture,
            duration } = tTextures(textures, tile.portTile);

        portMurphy.setTextures(texture, duration);

        tween = ctrl.data.tweens['port' + tile.key];
        let tweenPos = tween?[tween[1][0], tween[1][1]]:[0,0];

        if (viewTween) {
          tweenPos[0] += viewTween[1][0];
          tweenPos[1] += viewTween[1][1];
        }

        portMurphy.position.set(
          pos[0] * 32 + tweenPos[0],
          pos[1] * 32 + tweenPos[1]);

        portMurphy.update();

        portMurphy.alpha = 1;
      }

      if (viewTween) {
        sprite.position.set(
          sprite.position.x + viewTween[1][0],
          sprite.position.y + viewTween[1][1]);
      }

      sprite.update();
      if (newTexture) {
        lastByTile[tileKey] = sprite.lastTime;
      }
    });
  
  };
}

function bContainer(textures) {
  const container = dContainer();

  let borderLeft = sprite(textures['borderLeft']),
      borderRight = sprite(textures['borderRight']),
      borderTop = sprite(textures['borderTop']),
      borderBottom = sprite(textures['borderBottom']),
      borderTopLeft = sprite(textures['borderTopLeft']),
      borderTopRight = sprite(textures['borderTopRight']),
      borderBottomLeft = sprite(textures['borderBottomLeft']),
      borderBottomRight = sprite(textures['borderBottomRight']);

  let tileSize = 2,
      tileHeight = 32 * tileSize;
  

  borderLeft.height = tileHeight;
  borderRight.height = tileHeight;
  borderTop.width = tileHeight;
  borderBottom.width = tileHeight;

  borderLeft.position.set(0, 16);
  borderRight.position.set(16 + tileHeight, 16);
  borderTop.position.set(16, 0);
  borderBottom.position.set(16, 16 + tileHeight);
  borderTopLeft.position.set(0, 0);
  borderTopRight.position.set(16 + tileHeight, 0);
  borderBottomLeft.position.set(0, 16 + tileHeight);
  borderBottomRight.position.set(16 + tileHeight, 16 + tileHeight);


  container.addChild(borderLeft);
  container.addChild(borderRight);
  container.addChild(borderTop);
  container.addChild(borderBottom);
  container.addChild(borderTopLeft);
  container.addChild(borderTopRight);
  container.addChild(borderBottomLeft);
  container.addChild(borderBottomRight);

  return container;
}

