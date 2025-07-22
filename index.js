const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/players', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const url = `https://usatt.simplycompete.com/PlayerProfile?name=${encodeURIComponent(name)}`;

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const playerData = await page.evaluate(() => {
      const profile = {};

      const nameElem = document.querySelector('.profile-name');
      profile.name = nameElem ? nameElem.textContent.trim() : 'Not Found';

      const ratingElem = document.querySelector('.rating-score');
      profile.rating = ratingElem ? ratingElem.textContent.trim() : 'Unavailable';

      const clubElem = document.querySelector(".profile-club");
      profile.club = clubElem ? clubElem.textContent.trim() : 'Not Listed';

      const locationElem = document.querySelector(".profile-location");
      profile.cityState = locationElem ? locationElem.textContent.trim() : 'Unknown';

      const skillLevel = parseInt(profile.rating) > 2000 ? 'Advanced' :
                         parseInt(profile.rating) > 1200 ? 'Intermediate' : 'Beginner';

      return {
        name: profile.name,
        rating: profile.rating,
        club: profile.club,
        city: profile.cityState.split(',')[0],
        state: profile.cityState.split(',')[1]?.trim() || '',
        skill: skillLevel,
        tournaments: []
      };
    });

    await browser.close();
    res.json([playerData]);
  } catch (err) {
    console.error('Scraping failed:', err);
    res.status(500).json({ error: 'Failed to scrape USATT site' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
