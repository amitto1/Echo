// AI Vibe Recommendation Route
app.post('/api/ai/recommend', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt parameter is required' });
    }

    // Request Gemini to generate song/artist queries
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert music curator. Based on the user's mood or topic: "${prompt}", generate 5 popular songs with artist names. Return ONLY a raw JSON array of strings formatted like: ["Song Title - Artist", "Song Title - Artist"]. Do not wrap in markdown or backticks.`,
    });

    const text = response.text || '';
    console.log('Raw Gemini AI Response:', text);

    // Extract JSON array using regex if markdown backticks or surrounding text are present
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    let songQueries = [];

    if (jsonMatch) {
      try {
        songQueries = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse matched JSON array:', parseError);
      }
    }

    // Fallback if parsing fails or array is empty
    if (!Array.isArray(songQueries) || songQueries.length === 0) {
      songQueries = [
        `${prompt} music`,
        `${prompt} songs`,
        `best of ${prompt}`
      ];
    }

    res.json({ queries: songQueries });
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    res.status(500).json({ error: 'Failed to generate AI playlist', queries: [`${req.body.prompt} playlist`] });
  }
});