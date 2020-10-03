import React from 'react'
import styled from 'styled-components'
import { useTable, useCellSelect } from 'react-table'

import makeData from './makeData'

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`

function Table({ columns, data }) {
  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    // getTableCellSelectProps is used in conjuction with cell.getCellSelectProps() to provide a default behavior
    // Using these two props objects is optional - they provide a familiar click-and-drag-to-select interface
    // If you have different UI needs, you can choose not to use these. You can control the selection manually using the four methods provided below
    getTableCellSelectProps,
    // setCellSelecting() accepts a bool which indicates whether cells are currently being selected (true) or not (false)
    setCellSelecting,
    // setCellSelectionOrigin() and setSelectionExtent() each accept an object of the form {colIndex: int, rowIndex: int}
    // Ensure that you do not set the selection extent when the selection origin is not set.
    setCellSelectionOrigin,
    setCellSelectionExtent,
    // resetCellSelection() takes no arguments. It sets:
    //    state.cellSelecting to false
    //    state.cellSelectionOrigin to an empty object {}
    //    state.cellSelectionExtent to an empty object {}
    //    state.selectionExtents to an empty object {}
    resetCellSelection,
    headerGroups,
    rows,
    prepareRow,
    state: {
      // cellSelecting is a bool which indicates whether cells are currently being selected (true) or not (false)
      cellSelecting,
      // cellSelectionOrigin and cellSelectionExtent are each an object of the form {colIndex: int, rowIndex: int}
      cellSelectionOrigin,
      cellSelectionExtent,
      // selectionExtents is an object of the form:
      //    {
      //       minCol: int,
      //       minRow: int,
      //       maxCol: int,
      //       maxRow: int,
      //    }
      selectionExtents
    }
  } = useTable({
    columns,
    data,
    // autoResetCellSelection is a bool which determines whether the selection region will persist when table data refreshes
    // it defaults to false
    autoResetCellSelection: false
  },
  useCellSelect)


  // For default behavior pass the object returned from getTableCellSelectProps() into the getTableProps function
  return (
    <table {...getTableProps(getTableCellSelectProps())}>
      <thead>
        {headerGroups.map(headerGroup => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <th {...column.getHeaderProps()}>{column.render('Header')}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row)
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map(cell => {
                const {
                  // cell.coords is an object of the form {colIndex: int, rowIndex: int}
                  coords,
                  // cell.isSelected is a bool indicating whether the cell is currently selected
                  isSelected,
                  // cell.isSelectionOrigin is a bool indicating whether the cell is the selection origin
                  isSelectionOrigin,
                  // cell.isSelectionExtent is a bool indicating whether the cell is the selection origin
                  isSelectionExtent,
                  // cell.selectionBoundary is an object of the form:
                  //    {
                  //      top: bool,
                  //      right: bool,
                  //      bottom: bool,
                  //      left: bool,
                  //    }
                  // This object indicates whether the cell forms part of the selection boundary
                  selectionBoundary,
                  // cell.getCellSelectProps() provides cell props for the default click-and-drag-to-select behavior
                  getCellSelectProps
                } = cell
                const style = {
                  backgroundColor: cell.isSelectionOrigin ? 'lightgrey' : cell.isSelected ? 'grey' : undefined,
                  userSelect: 'none',
                  borderTop: cell.selectionBoundary.top && '1px solid green',
                  borderRight: cell.selectionBoundary.right && '1px solid green',
                  borderBottom: cell.selectionBoundary.bottom && '1px solid green',
                  borderLeft: cell.selectionBoundary.left && '1px solid green',
                }
                // For default behavior pass the object returned from cell.getCellSelectProps() into the cell.getCellProps() function
                return <td {...cell.getCellProps(cell.getCellSelectProps())} style={style}>{cell.render('Cell')}</td>
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function App() {
  const columns = React.useMemo(
    () => [
      {
        Header: 'Name',
        columns: [
          {
            Header: 'First Name',
            accessor: 'firstName',
          },
          {
            Header: 'Last Name',
            accessor: 'lastName',
          },
        ],
      },
      {
        Header: 'Info',
        columns: [
          {
            Header: 'Age',
            accessor: 'age',
          },
          {
            Header: 'Visits',
            accessor: 'visits',
          },
          {
            Header: 'Status',
            accessor: 'status',
          },
          {
            Header: 'Profile Progress',
            accessor: 'progress',
          },
        ],
      },
    ],
    []
  )

  const [data, setData] = React.useState(makeData(20))

  return (
    <Styles>
      <Table columns={columns} data={data} />
      <button onClick={e=>{e.preventDefault()
      setData(makeData(20))
      }}>Refresh data</button>
    </Styles>
  )
}

export default App
