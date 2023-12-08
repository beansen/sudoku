import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription  } from 'rxjs';
import { Cell } from '../cell.model';

const worker = new Worker(new URL('../board-creator.worker', import.meta.url));

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.css']
})
export class GridComponent implements OnInit, OnDestroy {

  startingBoard : Cell[] = [];
  errors = 0;
  sudokuNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  givenNumbers = 40;
  solvedNumbers: number[] = [];
  generatingGame: boolean = true;
  timerOutput: string = "0:00";
  timeCounter: number = 0;
  timerInterval = interval(1000);
  timerSubscription = new Subscription();
  selectedCell: Cell | undefined = undefined;
  gamePaused: boolean = false;

  ngOnInit(): void {
    worker.onmessage=({ data }) => {
      this.startingBoard = data;
      this.generatingGame = false;
      this.timeCounter = 0;

      for (let i = 1; i < 10; i++) {
        this.checkSolvedNumbers(i);
      }

      this.selectedCell = this.startingBoard[0];

      this.timerSubscription = this.timerInterval.subscribe(val => {
        if (!this.gamePaused) {
          this.timeCounter++;
          const elapsedTime = this.timeCounter + (this.errors * 15);
          this.timerOutput = this.getTimeFormated(elapsedTime);
        }
      });
    };
    this.newGame();
  }

  ngOnDestroy(): void {
    this.timerSubscription.unsubscribe();
  }

  newGame() {
    if (this.givenNumbers >= 17 && this.givenNumbers <= 81) {
      this.gamePaused = false;
      this.timerSubscription.unsubscribe();
      this.solvedNumbers = [];
      this.generatingGame = true;
      this.errors = 0;
      worker.postMessage({
        startingBoard: this.startingBoard,
        givenNumbers: this.givenNumbers
      });
    } else {
      alert("Sudoku board needs at least 17 and a maximum of 81 given values");
    }
  }

  cellsRange(from: number, to: number) {
    return this.startingBoard.slice(from, to + 1);
  }

  clickedCell(cell: Cell) {
    this.selectedCell = cell;
  }

  checkSolvedNumbers(numb: number) {
    const cells = this.startingBoard.filter(cell => cell.visible && cell.value == numb);
    if (cells.length == 9) {
      this.solvedNumbers.push(numb);
    }
  }

  selectNumber(numb: number) {
    if (this.selectedCell && !this.selectedCell.visible && !this.gamePaused) {
      let cell = this.startingBoard[this.selectedCell.row * 9 + this.selectedCell.column];
      if (cell.value == numb) {
        cell.visible = true;
        this.checkSolvedNumbers(numb);

        if (this.solvedNumbers.length == 9) {
          this.timerSubscription.unsubscribe();
        }
      } else {
        this.errors++;
      }
    }
  }

  getTimeFormated(time: number) {
    const minutes = Math.floor(time / 60) + ":";
    const seconds = time % 60;
    return minutes + (seconds < 10 ? "0" + seconds : seconds);
  }

  pauseGame() {
    this.gamePaused = !this.gamePaused;
  }
}
