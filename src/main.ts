import { BoardGameDisplayController } from './BoardGameDisplayController';

const main = async () => {
  const selectedCell: { x: number, y: number }[] = [];
  const BoardGame = new BoardGameDisplayController({
    width: 100,
    height: 30,
    initialValue: '0',
    callback: (x, y, value) => {
      if (value === '0') {
        selectedCell.push({ x, y });
        return '1';
      }
      selectedCell.splice(selectedCell.indexOf({ x, y }), 1);
      return '0';
    }
  });

  await BoardGame.start('Please place your pieces');

  console.log('Finish\n', selectedCell);
};

main();
