/// <reference lib="webworker" />

import { Cell } from "./cell.model";

let counter: number;

addEventListener('message', ({ data }) => {
  counter = 0;
  createNewBoard(data);
});

function createNewBoard(data: any) {
  try {
    const startingBoard = initGrid(data.startingBoard);
    const solvedBoard = solveGrid(startingBoard);
    if (solvedBoard) {
      const finalBoard = removeValues(81 - data.givenNumbers, solvedBoard);
      postMessage(finalBoard);
    }
  } catch(error) {
    createNewBoard(data);
  }
  
}

function initGrid(startingBoard: Cell[]) {
  if (startingBoard.length == 0) {
    let box = 0;
    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < 9; x++) {
        box = Math.floor(y / 3) * 3 + Math.floor(x / 3);
        startingBoard.push({
          value: 0,
          row: y,
          column: x,
          box: box,
          visible: false,
          possibleValues: generatePossibleValues()
        });
      }
    }
  } else {
    for (let i = 0; i < startingBoard.length; i++) {
      startingBoard[i].value = 0;
      startingBoard[i].visible = false;
      startingBoard[i].possibleValues = generatePossibleValues();
    }
  }


  return startingBoard;
}

function removeValues(amount: number, startingBoard: Cell[]) {
  let removedValues = 0;
  let gridCopy: Cell[] = [];
  let counter = 0;

  while (removedValues < amount) {
    const cells = startingBoard.filter(cell => cell.value != 0);
    const cell = cells[Math.floor(Math.random() * cells.length)];

    if (cell.value != 0) {
      const originalValue = cell.value;
      cell.value = 0;

      gridCopy = [];
      removedValues++;

      for (let i = 0; i < startingBoard.length; i++) {
        gridCopy[i] = {
          value: startingBoard[i].value,
          row: startingBoard[i].row,
          column: startingBoard[i].column,
          box: startingBoard[i].box,
          visible: startingBoard[i].value != 0 ? true : false,
          possibleValues: generatePossibleValues()
        };
      }

      if (!solveGrid(gridCopy)) {
        cell.value = originalValue;
        removedValues--;
      }
    }
  }

  for (let i = 0; i < gridCopy.length; i++) {
    gridCopy[i].possibleValues = gridCopy[i].visible ? [] : generatePossibleValues();
  }

  return gridCopy;
}

function solveGrid(grid: Cell[]) {
  const cell = nextEmptyCell(grid);

  if (!cell) return grid;

  counter++
  if (counter > 500000) throw new Error ("Recursion Timeout");

  const possibleValues = generatePossibleValues();

  for (let i = 0; i < possibleValues.length; i++) {
    let value = possibleValues[i];

    if (safeToPlace(cell, value, grid)) {
      grid[cell.row * 9 + cell.column].value = value;

      if (solveGrid(grid)) return grid;
      
      grid[cell.row * 9 + cell.column].value = 0;
    }   
  }

  return false;
}

function nextEmptyCell(grid: Cell[]) {
  for (let i = 0; i < grid.length; i++) {
    if (grid[i].value == 0) {
      return grid[i];
    }
  }

  return false;
}

function compareRow(row: number, value: number, grid: Cell[]) {
  let cells = grid.filter((cell) => cell.row === row);
  let isSafe = true;
  cells.every(cell => {
    if (cell.value === value) {
      isSafe = false;
      return false;
    }

    return true;
  });

  return isSafe;
}

function compareColumn(column: number, value: number, grid: Cell[]) {
  let cells = grid.filter((cell) => cell.column === column);
  let isSafe = true;
  cells.every(cell => {
    if (cell.value === value) {
      isSafe = false;
      return false;
    }

    return true;
  });

  return isSafe;
}

function compareBox(box: number, value: number, grid: Cell[]) {
  let cells = grid.filter((cell) => cell.box === box);
  let isSafe = true;
  cells.every(cell => {
    if (cell.value === value) {
      isSafe = false;
      return false;
    }

    return true;
  });

  return isSafe;
}

function safeToPlace(cell: Cell, value: number, grid: Cell[]) {
  return compareRow(cell.row, value, grid) && compareColumn(cell.column, value, grid) && compareBox(cell.box, value, grid);
}

function generatePossibleValues() {
  return shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
}

function shuffleArray(array: number[]) {
  return array.map(value => ({ value, sort: Math.random() }))
  .sort((a, b) => a.sort - b.sort)
  .map(({ value }) => value);
}
