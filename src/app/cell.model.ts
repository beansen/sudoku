export interface Cell {
    value: number,
    row: number,
    column: number,
    box: number,
    visible: boolean,
    possibleValues: Array<number>
}
