import fs from 'fs';
import axios from 'axios';


// CONFIG
const BOT_TOKEN = ""
const APPLICATION_ID = ""

const PATCH = "14.16.1"

// Helper function to introduce a delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function postLeagueEmojis() {
    // Read the image filenames from the directory
    const filenames = fs.readdirSync('images');

    const itemJson = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${PATCH}/data/en_US/item.json`)
    const itemData = itemJson.data.data


    for (const filename of filenames) {
        const image = fs.readFileSync(`images/${filename}`, { encoding: 'base64' });
        const dataURI = `data:image/png;base64,${image}`;

        const itemId = filename.split('.')[0];
        const itemName = itemData[itemId].name;

        // Apply regex to remove special characters and spaces and replace them with underscores, if it has a 's in the name, remove it but keep the s

        const emojiName = itemName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_s/g, 's');


        try {
            let success = false;
            while (!success) {
                try {
                    const response = await axios.post(
                        `https://discord.com/api/v10/applications/${APPLICATION_ID}/emojis`,
                        {
                            name: emojiName,
                            image: dataURI,
                        },
                        {
                            headers: {
                                Authorization: `Bot ${BOT_TOKEN}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );

                    console.log(response.data);
                    success = true;
                } catch (error) {
                    console.log(error.response)
                    if (error.response) {
                        if (error.response.status === 429) {
                            // Rate limit hit, wait for the retry_after duration specified in the response
                            const retryAfter = error.response.data.retry_after;
                            console.log(`Rate limited. Retrying after ${retryAfter} seconds.`);
                            await delay(retryAfter * 1000);
                        } else if (error.response.status === 400) {
                            // Handle specific error when request is bad (400)
                            console.error(`Failed to upload emoji ${itemId}: Bad request (400) - ${error.response.data.message}`);
                            success = true; // Skip this emoji and move to the next one
                        } else {
                            // Handle other status codes
                            console.error(`Failed to upload emoji ${itemId}: Status code ${error.response.status} - ${error.response.data.message}`);
                            success = true; // Skip this emoji and move to the next one
                        }
                    } else {
                        // Handle network or other errors
                        console.error(`Failed to upload emoji ${itemId}:`, error.message);
                        success = true; // Skip this emoji and move to the next one
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to upload emoji ${itemId}:`, error.message);
            break;
        }

    }
}

postLeagueEmojis();
