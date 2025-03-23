// routes/[featureName]Routes.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Get all items
router.get('/', async (req, res) => {
    try {
        const result = await sql.query`
            SELECT * FROM TableName
            ORDER BY CreatedAt DESC
        `;
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching items:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single item by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await sql.query`
            SELECT * FROM TableName 
            WHERE ID = ${id}
        `;
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching item:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new item
router.post('/', async (req, res) => {
    try {
        const { field1, field2, field3 } = req.body;
        
        // Validate request body
        if (!field1 || !field2) {
            return res.status(400).json({ message: 'Required fields missing' });
        }
        
        // Insert the new item
        await sql.query`
            INSERT INTO TableName (Field1, Field2, Field3, CreatedAt)
            VALUES (${field1}, ${field2}, ${field3}, GETDATE())
        `;
        
        res.status(201).json({ message: 'Item created successfully' });
    } catch (err) {
        console.error('Error creating item:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update existing item
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { field1, field2, field3 } = req.body;
        
        // Check if item exists
        const checkResult = await sql.query`
            SELECT * FROM TableName WHERE ID = ${id}
        `;
        
        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        
        // Update the item
        await sql.query`
            UPDATE TableName
            SET 
                Field1 = ${field1},
                Field2 = ${field2},
                Field3 = ${field3}
            WHERE ID = ${id}
        `;
        
        res.json({ message: 'Item updated successfully' });
    } catch (err) {
        console.error('Error updating item:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete item
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if item exists
        const checkResult = await sql.query`
            SELECT * FROM TableName WHERE ID = ${id}
        `;
        
        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        
        // Delete the item
        await sql.query`
            DELETE FROM TableName WHERE ID = ${id}
        `;
        
        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        console.error('Error deleting item:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;