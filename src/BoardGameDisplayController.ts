import * as readline from 'readline';

// ボードゲームの状態を管理するインターフェース
interface BoardGame<T> {
  width: number;
  height: number;
  board: T[][];
  cursorX: number;
  cursorY: number;
}

// プレイヤーの入力に対するコールバック関数の型定義
type CellCallback<T> = (x: number, y: number, value: T) => T;

// ボードゲームを制御するクラス
export class BoardGameDisplayController<T> {
  readonly DEFAULT_CURSOR_INTERVAL: number = 500;
  readonly DEFAULT_CURSOR_CHARACTER: string = 'X';
  readonly DEFAULT_CURSOR_SHOW: boolean = true;

  private game: BoardGame<T>;
  private rl: readline.Interface;
  private callback: CellCallback<T>;
  private message: string;
  private howToUseMessage: string;
  private resolve: ((value: void) => void) | null = null;
  private displayCursorIntervalId: NodeJS.Timeout | null = null;
  private cursorCharacter: string;
  private cursorInterval: number;
  private isShowCursor: boolean;

  constructor(props: {
    width: number,
    height: number,
    initialValue: T,
    callback: CellCallback<T>,
    cursorCharacter?: string,
    cursorInterval?: number,
    howToUseMessage?: string,
  }) {
    const {
      width,
      height,
      initialValue,
      callback,
      cursorCharacter,
      cursorInterval,
      howToUseMessage,
    } = props;

    this.game = {
      width,
      height,
      board: Array(height).fill(null).map(() => Array(width).fill(initialValue)),
      cursorX: 0,
      cursorY: 0,
    };
    this.callback = callback;
    this.message = '';

    this.cursorCharacter = cursorCharacter ?? this.DEFAULT_CURSOR_CHARACTER;
    this.cursorInterval = cursorInterval ?? this.DEFAULT_CURSOR_INTERVAL;
    this.isShowCursor = this.DEFAULT_CURSOR_SHOW;
    this.howToUseMessage = howToUseMessage ?? 'Use arrow keys to move, SPACE to select cell, and RETURN to finish selection';

    // 標準入出力の設定
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // キー入力の設定
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
  }

  // ゲームを開始する
  public start(message: string): Promise<void> {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.message = message;
      this.displayBoard();
      this.setupKeypressListener();
    });
  }

  private controlExit(): void {
    if (this.displayCursorIntervalId) {
      clearInterval(this.displayCursorIntervalId);
    }
    this.rl.close();
    if (this.resolve) {
      this.resolve();
    }
  }

  // keypressイベントリスナーを設定するメソッドを追加
  private setupKeypressListener(): void {
    process.stdin.on('keypress', (_, key) => {
      this.setCursorInterval();

      if (key.ctrl && key.name === 'c') {
        this.rl.close();
        process.exit();
      }

      switch (key.name) {
        case 'up':
          this.moveCursor(0, -1);
          break;
        case 'down':
          this.moveCursor(0, 1);
          break;
        case 'left':
          this.moveCursor(-1, 0);
          break;
        case 'right':
          this.moveCursor(1, 0);
          break;
        case 'space':
          this.handleSelection();
          break;
        case 'return':
          this.controlExit();
          break;
      }

      this.displayBoard();
    });
  }

  // カーソルを移動する
  private moveCursor(dx: number, dy: number): void {
    const rawNexX = this.game.cursorX + dx;
    const rawNextY = this.game.cursorY + dy;

    // マイナスの値になったとききの動作を担保
    const newX = (rawNexX + this.game.width) % this.game.width;
    const newY = (rawNextY + this.game.height) % this.game.height;

    this.game.cursorX = newX;
    this.game.cursorY = newY;
  }

  // カーソルを表示するintervalを設定する
  private setCursorInterval(): void {
    if (this.displayCursorIntervalId) {
      clearInterval(this.displayCursorIntervalId);
    }

    this.isShowCursor = this.DEFAULT_CURSOR_SHOW;
    this.displayCursorIntervalId = setInterval(() => {
      this.isShowCursor = !this.isShowCursor;
      this.displayBoard();
    }, this.cursorInterval);
  }

  // カーソルの位置の表示の管理
  private displayCursorCell({ x, y }: { x: number, y: number }): string {
    return this.isShowCursor ? this.cursorCharacter : `${this.game.board[y][x]}`;
  }

  // 選択位置の処理を実行する
  private handleSelection(): void {
    const result = this.callback(this.game.cursorX, this.game.cursorY, this.game.board[this.game.cursorY][this.game.cursorX]);
    this.game.board[this.game.cursorY][this.game.cursorX] = result;
  }

  // ボードを表示する
  private displayBoard(): void {
    console.clear();
    console.log(this.message);
    console.log(`${this.howToUseMessage}\n`);

    for (let y = 0; y < this.game.height; y++) {
      let row = '';
      for (let x = 0; x < this.game.width; x++) {
        if (x === this.game.cursorX && y === this.game.cursorY) {
          row += this.displayCursorCell({ x, y });
        } else {
          row += `${this.game.board[y][x]}`;
        }
      }
      console.log(row);
    }
  }
}
