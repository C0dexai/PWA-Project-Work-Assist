interface SpeakOptions {
    text: string;
    gender?: 'Male' | 'Female';
    onEnd?: () => void;
}

let utterance: SpeechSynthesisUtterance | null = null;
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

// Function to get voices asynchronously and cache the promise.
const getVoicesAsync = (): Promise<SpeechSynthesisVoice[]> => {
    if (voicesPromise) {
        return voicesPromise;
    }
    voicesPromise = new Promise((resolve) => {
        const checkVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                resolve(voices);
                return true;
            }
            return false;
        };

        if (!checkVoices()) {
            window.speechSynthesis.onvoiceschanged = () => {
                checkVoices();
            };
        }
    });
    return voicesPromise;
};


const getVoice = (voices: SpeechSynthesisVoice[], gender?: 'Male' | 'Female'): SpeechSynthesisVoice | undefined => {
    if (voices.length === 0) return undefined;

    const targetGender = gender === 'Male' ? 'male' : 'female';
    
    // Prioritize high-quality, local, English voices that match gender.
    const qualityVoices = voices.filter(voice => 
        voice.lang.startsWith('en') && voice.localService
    );

    let genderVoices = qualityVoices.filter(voice => voice.name.toLowerCase().includes(targetGender));
    
    // Fallback 1: Any English voice matching gender
    if (genderVoices.length === 0) {
       genderVoices = voices.filter(voice => 
            voice.lang.startsWith('en') && 
            voice.name.toLowerCase().includes(targetGender)
        );
    }
    
    // Fallback 2: Any voice matching gender
    if (genderVoices.length === 0) {
        genderVoices = voices.filter(voice => voice.name.toLowerCase().includes(targetGender));
    }
    
    // Fallback 3: If still no gender match, pick any quality English voice.
    if (genderVoices.length === 0) {
        return qualityVoices.find(v => v.name.includes('David') || v.name.includes('Zira')) || qualityVoices[0] || voices.find(v => v.lang.startsWith('en'));
    }

    return genderVoices[Math.floor(Math.random() * genderVoices.length)];
};


export const speak = async ({ text, gender, onEnd }: SpeakOptions) => {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    try {
        const voices = await getVoicesAsync();
        utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = getVoice(voices, gender);
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        utterance.onend = () => {
            if (onEnd) {
                onEnd();
            }
            utterance = null;
        };
        
        utterance.onerror = (event) => {
            // Log the specific error from the event object
            const synthesisError = event as SpeechSynthesisErrorEvent;
            console.error('SpeechSynthesisUtterance.onerror:', synthesisError.error);
            if (onEnd) { // Also call onEnd on error to reset UI state
                onEnd();
            }
            utterance = null;
        };
        
        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.error("Failed to initialize speech synthesis:", error);
        if (onEnd) {
            onEnd();
        }
    }
};

export const stop = () => {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
};