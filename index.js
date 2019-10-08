require('dotenv').config();

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
const ffmpeg = require('fluent-ffmpeg')

const temp = require('temp')
const fs = require('fs');
const https = require("https");
const speech = require('@google-cloud/speech');

const authHelper = require("./lib/authHelper.js");

let GCP_CLIENT = null; // Lazy Initialzation

/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.processSpeechToText = (req, res) => {
  console.log(`Process processSpeechToText`);

  var opts = {
    req: req,
    res: res
  }
  if (!authHelper().verifyToken(opts)) return;

  var url = req.body.url;
  if (url == null) res.end("Bad request");

  console.log("Download URL : " + url);

  // Initialize the GCP Client if necessary
  initialize();

  // Download and Convert
  const input = temp.path({
    suffix: '.oga'
  })
  const output = temp.path({
    suffix: '.flac'
  })

  // Download File
  const stream = fs.createWriteStream(input);
  var request = https.get(url, function (response) {
    console.log(`Download in progress : `);
    console.log(`Source : ${input}`);
    console.log(`Target : ${output}`);

    response.on('data', (d) => {
      stream.write(d);
    });

    // Download Completed
    response.on('end', async () => {
      console.log(`Download completed `);
      stream.end();
      
      //Convert OGG to Flac format
      convertOGGtoFlac(input, output, opts, (err) => {

        // Trigger Google API
        triggerAPI(output, opts);
      });
    });
  });
}


async function triggerAPI(filename, opts) {

  console.log("Trigger Speect to Text Google API")

  // Reads a local audio file and converts it to base64
  const file = fs.readFileSync(filename);
  const audioBytes = file.toString('base64');

  const audio = {
    content: audioBytes,
  };
  const config = {
    encoding: 'FLAC',
    sampleRateHertz: 16000,
    languageCode: 'yue-Hant-HK',
    alternativeLanguageCodes : ['zh-HK', 'ja-JP', 'zh', 'en-US', 'ko-KR']
  };
  const request = {
    audio: audio,
    config: config,
  };

  // Detects speech in the audio file
  const [response] = await GCP_CLIENT.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  console.log(`Transcription: ${transcription}`);

  let code = "000";
  if (transcription == "") {
    code = "409";
    transcription = "";
  }

  let result = {
    code: code,
    message: transcription
  };

  // Send Response
  opts.res.status(200).send(JSON.stringify(result));
}


function convertOGGtoFlac(input, output, opts, callback) {

  ffmpeg.ffprobe(input, (err, info) => {
    if (err) {
      console.log(err);
      let result = {
        code: "409",
        message: err
      };
    
      // Send Response
      opts.res.status(409).send(JSON.stringify(result));
      return;
    }

    const fileSize = info.format.duration
    console.log(`File size : ${fileSize}`)

    ffmpeg()
      .on('error', error => {
        console.log(error);
        let result = {
          code: "409",
          message: error
        };
        opts.res.status(409).send(JSON.stringify(result));
      })
      .on('end', () => {
        callback(output)
      })
      .input(input)
      .setStartTime(0)
      .duration(fileSize)
      .output(output)
      .audioFrequency(16000)
      .toFormat('flac')
      .run();
  })
}


function initialize() {
  if (GCP_CLIENT == null) {
    console.log("=============================================================");
    console.log("Google Application Credentials : " + process.env.GOOGLE_APPLICATION_CREDENTIALS);
    GCP_CLIENT = new speech.SpeechClient();
    console.log("=============================================================");
  }

  // Initialize ffmpeg
  ffmpeg.setFfprobePath(ffprobePath);
  ffmpeg.setFfmpegPath(ffmpegPath);

  console.log(`ffmpegPath  : ${ffmpegPath}`);
  console.log(`ffprobePath : ${ffprobePath}`);
}