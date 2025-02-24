// templates/post-template.js
const postRouter = express.Router();

// Get all posts
postRouter.get('/', (req, res) => {
    db.query('SELECT * FROM Posts', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ posts: results });
    });
});

// Create a new post
postRouter.post('/', (req, res) => {
    const { authorId, content } = req.body;
    db.query('INSERT INTO Posts (authorId, content) VALUES (?, ?)', [authorId, content], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Post created' });
    });
});

module.exports = postRouter;