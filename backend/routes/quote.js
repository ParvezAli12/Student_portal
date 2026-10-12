const express = require('express');
const router  = express.Router();

// GET /api/quote/today — proxies ZenQuotes API (avoids CORS issues in browser)
router.get('/today', async (req, res) => {
  try {
    const response = await fetch('https://zenquotes.io/api/today');
    const data = await response.json();
    const quote = Array.isArray(data) ? data[0] : null;

    if (!quote) {
      return res.json({ quote: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela' });
    }

    res.json({ quote: quote.q, author: quote.a });
  } catch (err) {
    // Fallback quote if the external API is unreachable
    res.json({ quote: 'The beautiful thing about learning is that no one can take it away from you.', author: 'B.B. King' });
  }
});

module.exports = router;