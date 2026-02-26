
// Simplified verification of the scoring logic changes

function mockFinishInterview(transcript) {
    const candidateAnswersCount = (transcript || []).filter(t => t.speaker === 'Candidate').length;

    let reportData;

    if (candidateAnswersCount < 3) {
        console.log(`Bypassing AI evaluation (count: ${candidateAnswersCount}).`);
        reportData = {
            overall_rating: 0,
            fit_for_role: 'NO',
            detailed_feedback: 'Score: 0\nFeedback: The interview was completed too quickly...'
        };
    } else {
        console.log(`Calling AI evaluation (count: ${candidateAnswersCount}).`);
        // Mocking AI response
        reportData = {
            overall_rating: 8.5,
            fit_for_role: 'YES',
            detailed_feedback: 'Score: 85\nFeedback: Strong technical performance...'
        };
    }
    return reportData;
}

const shortTranscript = [
    { speaker: 'AI', message: 'Hi, what is your name?' },
    { speaker: 'Candidate', message: 'My name is Aryan' }
];

const longTranscript = [
    { speaker: 'AI', message: 'Hi, what is your name?' },
    { speaker: 'Candidate', message: 'My name is Aryan' },
    { speaker: 'AI', message: 'Tell me about React.' },
    { speaker: 'Candidate', message: 'React is a library for UI.' },
    { speaker: 'AI', message: 'What are hooks?' },
    { speaker: 'Candidate', message: 'Hooks are for state.' }
];

console.log("--- Testing Short Transcript ---");
const result1 = mockFinishInterview(shortTranscript);
console.log(`Score: ${result1.overall_rating}, Fit: ${result1.fit_for_role}`);

console.log("\n--- Testing Long Transcript ---");
const result2 = mockFinishInterview(longTranscript);
console.log(`Score: ${result2.overall_rating}, Fit: ${result2.fit_for_role}`);
