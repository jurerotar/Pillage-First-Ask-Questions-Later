import { Resource } from 'interfaces/models/game/resources';

type Shape = {
  group: number;
  shape: number[][];
};

type OasisShapes = {
  [key in Resource]: {
    backgroundColor: string;
    shapes: Shape[];
  }
};

const oasisShapes: OasisShapes = {
  wheat: {
    backgroundColor: '#85A6DB',
    shapes: [
      {
        group: 1,
        shape: [
          [0, 1, 1],
          [0, 1, 1]
        ]
      },
      {
        group: 2,
        shape: [
          [0, 1, 1]
        ]
      },
      {
        group: 3,
        shape: [
          [0, 1, 3],
          [0, 1, 2],
          [1, 1, 2],
          [0, 1, 1]
        ]
      },
      {
        group: 4,
        shape: [
          [0, 1, 1],
          [0, 1, 2],
          [0, 1, 2]
        ]
      },
      {
        group: 5,
        shape: [
          [0, 1, 1],
          [1, 1, 2],
          [1, 1, 1],
          [1, 1, 0]
        ]
      },
      {
        group: 6,
        shape: [
          [0, 1, 2],
          [0, 1, 2],
          [0, 1, 3],
          [0, 0, 3]
        ]
      },
      {
        group: 7,
        shape: [
          [0, 1, 0],
          [0, 1, 0]
        ]
      }
    ]
  },
  iron: {
    backgroundColor: '#7B90A1',
    shapes: [
      {
        group: 1,
        shape: [
          [0, 1, 2],
          [0, 1, 2]
        ]
      },
      {
        group: 2,
        shape: [
          [0, 1, 0],
          [0, 1, 1]
        ]
      },
      {
        group: 3,
        shape: [
          [0, 1, 1]
        ]
      },
      {
        group: 4,
        shape: [
          [0, 1, 1],
          [0, 1, 0],
          [0, 1, 0]
        ]
      },
      {
        group: 5,
        shape: [
          [0, 1, 1],
          [0, 1, 2],
          [0, 1, 2]
        ]
      },
      {
        group: 8,
        shape: [
          [0, 1, 0],
          [0, 1, 0]
        ]
      }
    ]
  },
  wood: {
    backgroundColor: '#426002',
    shapes: [
      {
        group: 1,
        shape: [
          [0, 1, 1]
        ]
      },
      {
        group: 2,
        shape: [
          [0, 1, 1],
          [0, 0, 1],
          [0, 0, 1]
        ]
      },
      {
        group: 3,
        shape: [
          [0, 1, 2],
          [0, 0, 1]
        ]
      },
      {
        group: 4,
        shape: [
          [0, 1, 1],
          [0, 1, 0],
          [0, 1, 0]
        ]
      },
      {
        group: 5,
        shape: [
          [0, 1, 0],
          [0, 1, 0]
        ]
      },
      {
        group: 6,
        shape: [
          [1, 0, 1],
          [1, 1, 1]
        ]
      }
    ]
  },
  clay: {
    backgroundColor: '#C29760',
    shapes: [
      {
        group: 1,
        shape: [
          [0, 1, 0],
          [0, 1, 1]
        ]
      },
      {
        group: 2,
        shape: [
          [0, 1, 1],
          [0, 0, 1]
        ]
      },
      {
        group: 3,
        shape: [
          [0, 1, 1],
          [0, 1, 0]
        ]
      },
      {
        group: 4,
        shape: [
          [0, 1, 0],
          [0, 1, 1],
          [0, 0, 1]
        ]
      },
      {
        group: 5,
        shape: [
          [0, 1, 1]
        ]
      }
    ]
  }
};

export default oasisShapes;
