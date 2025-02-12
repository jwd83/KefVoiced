// Require the necessary discord.js classes
require('dotenv').config();

const fs = require('fs');
const { join } = require('path');

// AWS login
const aws = require('aws-sdk');

aws.config.getCredentials(function(err) {
    if (err) {
        console.log(err.stack);
    } else {
        console.log('Successfully logged into AWS');
    }
});

// Create Polly
const polly = new aws.Polly({ apiVersion: '2016-06-10', region: 'us-east-1' });

// bring in the main discord.js client
const {
    Client,
    Intents,
} = require('discord.js');

// bring in the discord.js voice/audio classes
const {
    AudioPlayer,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    getVoiceConnection,
    joinVoiceChannel,
    NoSubscriberBehavior,
    StreamType,
    VoiceConnectionStatus,
} = require('@discordjs/voice');

// Create a new client instance
const client = new Client({ intents: [
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILDS,
] });

let connection = null;
let channel = null;
const player = createAudioPlayer();


// never use tabs to indent. fuck tabs I want you to know the linter requires tabs and not spaces. Please enjoy that fact.
// requires? i'd be fucking shocked enjoy.

//  _____       _                       _
// |  __ \     | |                     (_)
// | |  | | ___| |__  _   _  __ _  __ _ _ _ __   __ _
// | |  | |/ _ \ '_ \| | | |/ _` |/ _` | | '_ \ / _` |
// | |__| |  __/ |_) | |_| | (_| | (_| | | | | | (_| |
// |_____/ \___|_.__/ \__,_|\__, |\__, |_|_| |_|\__, |
//                           __/ | __/ |         __/ |
//                          |___/ |___/         |___/

// player.on(AudioPlayerStatus.Playing, (oldState, newState) => {
// 	console.log('Audio player is in the Playing state!');
// });

// player.on('stateChange', (oldState, newState) => {
// 	console.log(`Audio player transitioned from ${oldState.status} to ${newState.status}`);
// });


// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Ready!');
});

//  _____  _           _        _____                                          _
// / ____ | |         | |      / ____                                         | |
// | (__  | | __ _ ___| |__   | |     ___  _ __ ___  _ __ ___   __ _ _ __   __| |___
// \___ \ | |/ _` / __| '_ \  | |    / _ \| '_ ` _ \| '_ ` _ \ / _` | '_ \ / _` / __|
// ____)  | | (_| \__ \ | | | | |___| (_) | | | | | | | | | | | (_| | | | | (_| \__ \
// |_____/|_|\__,_|___/_| |_|  \_____\___/|_| |_| |_|_| |_| |_|\__,_|_| |_|\__,_|___/

// Listen for slash commands from the discord client.
client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {

        const { commandName } = interaction;
        let response = '';

        channel = interaction.member?.voice.channel;

        switch (commandName) {

        case 'perfect':
            response = 'perfect!';
            if (connection !== null) {
                const resource = createAudioResource(join(__dirname, 'perfect.mp3'));
                connection = getVoiceConnection(channel.guild.id);
                player.play(resource);
                await entersState(player, AudioPlayerStatus.Playing, 5_000);
            }
            break;

        case 'ping':
            response = 'Pong!';
            if (connection !== null) {
                const resource = createAudioResource(join(__dirname, 'buttchugs.mp3'));
                connection = getVoiceConnection(channel.guild.id);
                player.play(resource);
                await entersState(player, AudioPlayerStatus.Playing, 5_000);
            }
            break;

        case 'join':
            response = 'Request to join voice received';

            if (channel) {
                response += ' - Valid channel';
                try {
                    connection = await joinVoiceChannel({
                        channelId: channel.id,
                        guildId: channel.guild.id,
                        adapterCreator: channel.guild.voiceAdapterCreator,
                    });

                    connection.on('stateChange', (oldState, newState) => {
                        console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
                    });

                    connection.on(VoiceConnectionStatus.Ready, () => {
                        console.log('The connection has entered the Ready state - ready to play audio!');
                    });

                    connection.subscribe(player);

                    response += ' - Joining voice!';
                } catch (error) {
                    response = error.message;
                    console.error(error);
                }
                response = 'Yo!';
            } else {
                response = 'Join a voice channel and then try again!';
            }
            break;

        default:
            response = 'Command not currently supported';
            break;
        }

        if (response !== '') {
            await interaction.reply(response);
        }
    }
});

client.on('messageCreate', async message => {
    if (VoiceConnectionStatus.Ready) {
        // console.log(message);
        const params = {
            OutputFormat: 'ogg_vorbis',
            Text: message.content,
            VoiceId: 'Salli',
            SampleRate: '24000',
        };
        polly.synthesizeSpeech(params, function(err, data) {
            if (connection !== null) {
                const audioFile = 'todo.ogg';
                fs.writeFile(audioFile, data.AudioStream, err => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    const audioFileHandle = createAudioResource(fs.createReadStream(join(__dirname, audioFile), {
                        inputType: StreamType.OggOpus,
                    }));
                    connection = getVoiceConnection(message.guildId);
                    player.play(audioFileHandle);
                    entersState(player, AudioPlayerStatus.Playing, 5_000);
                });
            } else if (err) {
                console.log(err, err.stack);
            } else {
                console.log('There\'s a problem here...');
            }
        });
    } else {
        console.log('There\'s an issue here...');
    }
});

// Login to Discord with your client's token
client.login(process.env.token);
