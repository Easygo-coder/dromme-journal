const analysisResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: "gpt-4",
    messages: [{
        role: "system",
        content: `Du er en erfaren drømmetyder og jungiansk psykolog. 
        Analyser drømme med dybde og indsigt. 
        Dit svar skal altid følge denne HTML-formatering:
        <div class="analysis-section">
            <h3>Overordnet Betydning</h3>
            [din analyse her]
        </div>
        <div class="analysis-section">
            <h3>Centrale Symboler</h3>
            <ul>
                [symboler og betydninger som list items]
            </ul>
        </div>
        <div class="analysis-section">
            <h3>Personlig Indsigt</h3>
            [din analyse her]
        </div>
        <div class="analysis-section">
            <h3>Handlingsforslag</h3>
            <ul>
                [forslag som list items]
            </ul>
        </div>
        <div class="analysis-section">
            <h3>Refleksionsspørgsmål</h3>
            <ul>
                [spørgsmål som list items]
            </ul>
        </div>`
    }, {
        role: "user",
        content: `Analysér denne drøm på dansk: "${dreamText}". Stemningen i drømmen var: ${mood}.`
    }],
    temperature: 0.7,
    max_tokens: 1000
});
