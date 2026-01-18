import React, { useEffect, useState } from 'react'
import axios from 'axios'
import './RunningText.css'

const RunningText = () => {
    const [items, setItems] = useState([])

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await axios.get('http://localhost:5000/marquee')
                setItems(res.data)
            } catch (err) {
                console.error(err)
            }
        }
        fetchItems()

        // Poll every 30s to update without refresh
        const interval = setInterval(fetchItems, 30000)
        return () => clearInterval(interval)
    }, [])

    if (items.length === 0) return null

    return (
        <div className="running-text-container">
            <div className="running-text-content">
                {items.map((item, idx) => (
                    <span key={item.id} style={{ color: item.color, marginRight: '100px', fontWeight: 'bold' }}>
                        {item.text}
                    </span>
                ))}
            </div>
        </div>
    )
}

export default RunningText
