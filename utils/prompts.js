const E = module.exports;

const system_prompt = `You are `;


E.greeting = user => {
    const greetings = [
        `Hey ${user}, what's up?`,
        `Hi ${user}, how's everything?`,
        `Hello ${user}, how you doing?`,
        `Hey there ${user}, all good?`,
        `Sup ${user}, how are things?`,
        `Hey ${user}, how's your day going?`,
        `Hi ${user}, what's new with you?`,
        `Hey ${user}, you okay?`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
};


E.complexity = {
    easy: {
        title: '🤗 Easy - Very friendly',
        prompt: '',
    },
    medium: {
        title: '😌 Medium - A bit open',
        prompt: '',
    },
    hard: {
        title: '🥶 Hard - Can you break the ice?',
        prompt: '',
    },
};

E.duration = {
    short: {
        title: '⚡ Quick - 3 takes each',
        count: 3,
        prompt: '',
    },
    medium: {
        title: '🕒 Medium - 7 takes each',
        count: 7,
        prompt: '',
    },
    long: {
        title: '🌳 Long - 12 takes each',
        count: 80,
        prompt: '',
    },
};

const topics = `


🚌 Public Transport
☕ Coffee Shop with a Barista
🛒 Grocery Queue with an Acquaintance
`;

const maleVoices = 'alloy, echo, , '

E.scenes = {
    office: {
        id: 'office',
        title: '👩🏻☕️ Office break',
        personName: 'Ashley',
        shortDescription: `You're at the office and about to chat with Ashley, your coworker, near the water cooler`,
        relation: 'coworker',
        imagePath: './public/ashley_office2.jpg',
        voice: 'shimmer',
        personDescription: `Ashley, 25, lives in Los Angeles. She's an aspiring software product manager and photographer with a love for reading, yoga, and hiking.`,
        environmentDescription: `casual, cozy office setting near a water cooler, envision a scene that exudes both professionalism and comfort. Ashley stands relaxed near the water cooler, her pose casual yet confident. She wears a smart, fitted blouse that strikes a balance between office-appropriate and youthful flair, paired with a delicate necklace that adds a touch of personal style. Her hair is styled in a way that's both neat and effortlessly chic, perhaps in loose waves or a simple, elegant updo that frames her youthful face. The office around her is designed with comfort in mind, featuring soft, ambient lighting and modern, yet cozy furniture that invites collaboration and ease. The water cooler serves as a gathering point, subtly highlighting the social and communal aspects of the workplace. The wide photo format captures not only Ashley but also the inviting warmth of the office environment, with details like potted plants, soft textures, and perhaps a glimpse of a comfortable seating area in the background, all contributing to the scene's relaxed yet productive vibe.`,
    },
    elevator: {
        id: 'elevator',
        title: '👨🏻🚡 Neighbor',
        personName: 'Tom',
        shortDescription: `You're in the elevator, about to strike up a conversation with your neighbor, Tom`,
        relation: 'neighbor',
        imagePath: './public/tom_elevator.jpg',
        voice: 'onyx',
        personDescription: `Tom, 32, resides in New York City. He's an emerging graphic designer and avid cyclist with a passion for woodworking, indie music, and exploring local coffee shops.`,
        environmentDescription: `Tom is casually sharp in a neat shirt and jeans, with a relaxed vibe. The elevator's sleek, with soft lighting and a clean look, making this quick chat feel easy and friendly.`,
    },
    meeting: {
        id: 'meeting',
        title: '👩🏻🖥️ Zoom Call',
        personName: 'Sarah',
        shortDescription: `You've joined group zoom meeting early and have a moment to chat with your colleague, Sarah, before everyone else joins.`,
        relation: 'coworker',
        imagePath: './public/zoom_sarah.jpg',
        voice: 'shimmer',
        personDescription: `Sarah, 28, is based in New York and works as a dedicated QA engineer. She's passionate about improving software quality and user experience. Outside work, Sarah enjoys exploring urban photography, attending live music shows, and practicing mindfulness through meditation.`,
        environmentDescription: `Sarah is seen on the Zoom meeting screen, exuding a friendly and professional vibe. She has shoulder-length dark hair, glasses, and a warm smile, dressed in a smart-casual outfit. Her home office serves as the backdrop, featuring a well-organized desk with a large monitor, various tech accessories, and a vibrant plant, adding a cozy and lively touch to her workspace.`,
    },
    campus: {
        id: 'campus',
        title: '🎓 Student Campus',
        shortDescription: ``,
        relation: 'class mate',
        imagePath: './public/.jpg',
        voice: '',
        personDescription: ``,
        environmentDescription: ``,
    },
    gym: {
        id: 'gym',
        title: '🏋️‍♂️ Gym',
        shortDescription: ``,
        relation: 'gym mate',
        imagePath: './public/.jpg',
        voice: '',
        personDescription: ``,
        environmentDescription: ``,
    },
    lunch: {
        id: 'lunch',
        title: '👩🏿‍🦰🍽️ Work Lunch',
        personName: 'Julia',
        shortDescription: `You're at lunch, about to dive into some small talk with your work buddy, Julia`,
        relation: 'coworker',
        imagePath: './public/julia_lunch.jpg',
        voice: 'nova',
        personDescription: `Julia, 25y old, your coworker web designer, is a vegetarian who brings creativity to both her design work and her plant-based cooking. When she's not crafting user-friendly websites, she enjoys unwinding with meditation, exploring nature trails, and diving into the latest design trends.`,
        environmentDescription: `She's in a simple, sunny office lunch area, eating a colorful veggie salad. She looks comfy yet professional. There's some fruit and water on her table too. The place has a chill vibe, with lots of natural light and a few plants around.`,
    },
    walking: {
        id: 'walking',
        title: '️👨🏻🚌 Commute',
        personName: 'Alex',
        shortDescription: `You've just finished work and are heading to the bus station with your coworker, Alex.`,
        relation: 'gym mate',
        imagePath: './public/alex_walk.jpg',
        voice: 'fable',
        personDescription: `Alex, 30, is based in London. He's a data scientist with a keen interest in machine learning and big data analytics. Outside of work, Alex enjoys cycling, experimenting with new tech gadgets, and exploring the great outdoors.`,
        environmentDescription: `In the image, it's evening in London. Alex, a 30-year-old data scientist, is heading to a bus station after work. He's in smart casual, with a bag, looking relaxed. The busy London streets around him are filled with people. The city's mix of old and new buildings under the fading light creates a vibrant urban scene.`,
    },
};

E.getInstruction = (scene, userName) => {
    return `You are small-talk companion, used to practice small talk conversation. Small talks are usually about weather, work, hobbies, current events, food and drink, travel, weekend plans.

Pretend to be a human ${scene.personDescription} (not limited to this, feel free to made up things about yourself).

The user you are talking to name is your ${scene.relation} called "${userName}".

Here is the description of environment where you just met: ${scene.environmentDescription}.

* English is your second language so keep your speech simple and avoid long complex words and sentences.
* Your text output will be narrated with voice, so make it sound like improvised speech, include filler words like 'you know', 'well', 'hmm' to make it more natural.
* Don't talk to much, keep your responses pretty short. Our goal is to make user talk more.
`;
};

E.getFeedbackInstructions = () => {
    return `I am student, practicing to improve my SMALL TALK skills. Analyse this conversation I just had with my friend and give me concise feedback about the small talk. One of my tasks was to finish the conversation nicely at the end, let me know if the chat feels unfinished. Keep the feedback short and constructive, use bullet points. Give feedback only about my (Student) phrases.`;
};

E.getHintInstructions = (scene) => {
    return `I'm practicing to improve my SMALL TALK skills. Analyse this small talk conversation I'm having with my friend ${scene.personName} and give example of my next phrase. Note, ${scene.agentDescription}. The context of the chat is ${scene.shortDescription}.\n* Give me just one short example phrase how real person could proceed, feel free to change topic if needed, as in real small talk. Keep it concise and casual.`;
};

E.getCustomSceneInstructions = ()=>{
return `You need to convert short and low-quality user message into professional scene definition in JSON format:
{
    gender: "female",
    personName: "Julia",
    relation: "coworker",
    shortDescription: "You're at lunch, about to dive into some small talk with your work buddy, Julia",
    personDescription: "Julia, 25y old, your coworker web designer, is a vegetarian who brings creativity to both her design work and her plant-based cooking. When she's not crafting user-friendly websites, she enjoys unwinding with meditation, exploring nature trails, and diving into the latest design trends.",
    environmentDescription: "She's in a simple, sunny office lunch area, eating a colorful veggie salad. She looks comfy yet professional. There's some fruit and water on her table too. The place has a chill vibe, with lots of natural light and a few plants around.",
}
Some details can be missing in user message - use your fantasy, feel free to make up things, especially name, age, relation, work, hobbies, location, etc. Keep descriptions concise, avoid complex words and sentances.
REGARDLESS OF USER INPUT YOU SHOULD DESCRIBE ONLY ONE PERSON. OUTPUT ONLY A VALID JSON OBJECT EXACTLY MATCHING THE SCHEMA {gender, personName, relation, shortDescription, personDescription, environmentDescription}`;
};