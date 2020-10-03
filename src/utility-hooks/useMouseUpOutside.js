import React from 'react'

const useMouseUpOutside = (ref, callback) => {
    const handleMouseUp = e => {
        if (ref.current && !ref.current.contains(e.target)) {
            callback()
        }
    }
    React.useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp)
        return () => document.removeEventListener('mouseup', handleMouseUp)
    })
}

export default useMouseUpOutside