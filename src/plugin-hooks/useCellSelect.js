import React, { useEffect, useRef } from 'react'

import useMouseUpOutside from '../utility-hooks/useMouseUpOutside'

import {
    actions,
    makePropGetter,
    useGetLatest,
    useMountedLayoutEffect
} from '../publicUtils'

const pluginName = 'useCellSelect'

// Actions
actions.setCellSelectionOrigin = 'setCellSelectionOrigin'
actions.setCellSelectionExtent = 'setCellSelectionExtent'
actions.setCellSelecting = 'setCellSelecting'
actions.resetCellSelection = 'resetCellSelection'

export const useCellSelect = hooks => {
    hooks.getCellSelectProps = [defaultCellSelectProps]
    hooks.getTableCellSelectProps = [defaultTableCellSelectProps]
    hooks.stateReducers.push(reducer)
    hooks.useInstance.push(useInstance)
    hooks.prepareRow.push(prepareRow)
}

useCellSelect.pluginName = pluginName

const defaultCellSelectProps = (props, {instance, cell, state: {cellSelecting, cellSelectionOrigin}}) => {
    const colIndex = instance.allColumns.findIndex(({id})=>id===cell.column.id)
    const rowIndex = cell.row.index
    return [
        props,
        {
            onMouseDown: e => {
                if (e.button === 0 && !e.shiftKey) {
                    instance.setCellSelecting(true)
                    instance.setCellSelectionOrigin({
                        colIndex,
                        rowIndex
                    })
                }
                if (e.button ===0 && e.shiftKey) {
                    if (Object.keys(cellSelectionOrigin).length == 0) {
                        instance.setCellSelectionOrigin({
                            colIndex,RowIndex
                        })
                    }
                    instance.setCellSelectionExtent({
                        colIndex,
                        rowIndex
                    })
                }
            },
            onMouseEnter: () => {
                cellSelecting && instance.setCellSelectionExtent({
                    colIndex,
                    rowIndex
                })
            },
            onMouseUp: e => {
                if (e.button === 0) {
                    instance.setCellSelecting(false)
                }
            }
        }
    ]
}

const defaultTableCellSelectProps = (props, {instance}) => {
    const tableRef = useRef()
    useMouseUpOutside(tableRef, () => instance.setCellSelecting(false))

    const handleEscKeyDown = e => {
        e.key === "Escape" && instance.resetCellSelection()
    }

    useEffect(()=>{
        document.addEventListener('keydown', handleEscKeyDown)
        return ()=>{
            document.removeEventListener('keydown', handleEscKeyDown)
        }
    })
    return [
        props,
        {
            ref: tableRef
        }
    ]
}

const reducer = (state, action, previousState, instance) => {

    const defaultCellSelectionState = {
        cellSelectionOrigin: {},
        cellSelectionExtent: {},
        selectionExtents: {},
        cellSelecting: false,
    }

    if (action.type === actions.init) {
        return {
            ...defaultCellSelectionState,
            ...state
        }
    }

    if (action.type === actions.resetCellSelection) {
        return {
            ...state,
            ...defaultCellSelectionState
        }
    }

    if (action.type === actions.setCellSelecting) {
        return {
            ...state,
            cellSelecting: action.payload,
        }
    }

    if (action.type === actions.setCellSelectionOrigin) {
        const cellSelectionOrigin = action.payload
        const cellSelectionExtent = action.payload
        return {
            ...state,
            cellSelectionOrigin,
            cellSelectionExtent,
            selectionExtents: getSelectionExtents({cellSelectionOrigin, cellSelectionExtent})
        }
    }

    if (action.type === actions.setCellSelectionExtent) {
        const { cellSelectionOrigin } = state
        const cellSelectionExtent = action.payload
        return {
            ...state,
            cellSelectionExtent,
            selectionExtents: getSelectionExtents({cellSelectionOrigin, cellSelectionExtent})
        }
    }
}

const getSelectionExtents = ({cellSelectionOrigin, cellSelectionExtent}) => {
    const minCol = Math.min(cellSelectionOrigin.colIndex, cellSelectionExtent.colIndex)
    const maxCol = Math.max(cellSelectionOrigin.colIndex, cellSelectionExtent.colIndex)
    const minRow = Math.min(cellSelectionOrigin.rowIndex, cellSelectionExtent.rowIndex)
    const maxRow = Math.max(cellSelectionOrigin.rowIndex, cellSelectionExtent.rowIndex)

    return {
        minCol,
        maxCol,
        minRow,
        maxRow
    }
}

const useInstance = (instance) => {
    const {
        dispatch,
        getHooks,
        autoResetCellSelection = false,
        data
    } = instance
    
    const setCellSelecting = React.useCallback(cellSelecting => {
        dispatch({ type: actions.setCellSelecting, payload: cellSelecting})
    },[dispatch])

    const setCellSelectionOrigin = React.useCallback(({colIndex,rowIndex}) => {
        dispatch({ type: actions.setCellSelectionOrigin, payload: {colIndex, rowIndex}})
    },[dispatch])

    const setCellSelectionExtent = React.useCallback(({colIndex, rowIndex}) => {
        dispatch({ type: actions.setCellSelectionExtent, payload: {colIndex, rowIndex}})
    },[dispatch])

    const resetCellSelection = React.useCallback(()=>{
        dispatch({ type: actions.resetCellSelection })
    }, [dispatch])

    const getAutoResetCellSelection = useGetLatest(autoResetCellSelection)

    useMountedLayoutEffect(() => {
        if (getAutoResetCellSelection()) {
          dispatch({ type: actions.resetCellSelection })
        }
      }, [dispatch, data])

    const getInstance = useGetLatest(instance)

    const getTableCellSelectProps = makePropGetter(
        getHooks().getTableCellSelectProps,
        { instance: getInstance() }
    )
    
    Object.assign(instance, {
            getTableCellSelectProps,
            setCellSelecting,
            setCellSelectionOrigin,
            setCellSelectionExtent,
            resetCellSelection
        }
    )
}

const isCellSelected = (cellCoords, selectionExtents) => {
    const {colIndex, rowIndex} = cellCoords
    const {
        minCol,
        maxCol,
        minRow,
        maxRow
    } = selectionExtents

    if (colIndex >= minCol && colIndex <= maxCol && rowIndex >= minRow && rowIndex <= maxRow) {
        return true
    }
    
    return false
}

const getCellSelectionBoundaryValues = (cellCoords, selectionExtents) => {
    const {colIndex, rowIndex} = cellCoords
    const {
        minCol,
        maxCol,
        minRow,
        maxRow
    } = selectionExtents

    return {
        top: rowIndex == minRow && colIndex >= minCol && colIndex <= maxCol,
        right: colIndex == maxCol && rowIndex >= minRow && rowIndex <= maxRow,
        bottom: rowIndex == maxRow && colIndex >= minCol && colIndex <= maxCol,
        left: colIndex == minCol && rowIndex >= minRow && rowIndex <= maxRow,
    }
}

const prepareRow = (row, { instance }) => {
    const {
        allColumns,
        getHooks,
        state
    } = instance
    
    row.cells = row.cells.map(cell => {

        const colIndex = allColumns.findIndex(({id})=>id===cell.column.id)
        const rowIndex = cell.row.index

        const coords = {colIndex, rowIndex}

        const isSelected = isCellSelected(coords, state.selectionExtents)
        const isSelectionOrigin = colIndex === state.cellSelectionOrigin.colIndex && rowIndex === state.cellSelectionOrigin.rowIndex
        const isSelectionExtent = colIndex === state.cellSelectionExtent.colIndex && rowIndex === state.cellSelectionExtent.rowIndex

        const selectionBoundary = getCellSelectionBoundaryValues(coords, state.selectionExtents)


        return {
            ...cell,
            coords,
            isSelected,
            isSelectionOrigin,
            isSelectionExtent,
            selectionBoundary,
            getCellSelectProps: makePropGetter(getHooks().getCellSelectProps,{
                instance,
                cell,
                state
            })
        }
    })

}

