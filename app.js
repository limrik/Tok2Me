const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const app = express();
const { promisify } = require('util');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const execPromise = promisify(exec);
const readFilePromise = promisify(fs.readFile);
const unlinkPromise = promisify(fs.unlink);

function convertToMp3(filePath, mp3FilePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .toFormat('mp3')
      .on('end', () => resolve())
      .on('error', reject)
      .save(mp3FilePath);
  });
}

function convertToWav(mp3FilePath, wavFilePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(mp3FilePath)
      .toFormat('wav')
      .on('end', () => resolve())
      .on('error', reject)
      .save(wavFilePath);
  });
}

const transcribe = async (filepath, filename) => {
  const filePath = filepath;
  const mp3FilePath = `./videos/${filename}.mp3`;
  const wavFilePath = mp3FilePath.replace('.mp3', '.wav');

  try {
    await convertToMp3(filePath, mp3FilePath);
    await convertToWav(mp3FilePath, wavFilePath);

    // Run the Python script
    const { stdout, stderr } = await execPromise(
      //   `python3 ./python/process_audio.py ${wavFilePath}`
      `python3 python/process_audio.py ${wavFilePath}`
    );
    if (stderr) {
      throw new Error(stderr);
    }

    // Read the output JSON file
    const data = await readFilePromise('output.json', 'utf8');
    const diarizationResults = JSON.parse(data);

    // Clean up files
    // setTimeout(async () => {
    //   try {
    //     await unlinkPromise(filePath);
    //     await unlinkPromise(mp3FilePath);
    //     await unlinkPromise(wavFilePath);
    //     await unlinkPromise('output.json');
    //   } catch (err) {
    //     console.error('Error during file cleanup:', err);
    //   }
    // }, 3000);

    return diarizationResults;
  } catch (error) {
    console.log(error);
  }
};

const transcribe2 = async (filepath, filename) => {
  const filePath = filepath;
  console.log('filepath', filePath);
  const wavFilePath = `./videos/${filename}.txt`;

  try {
    // Run the Python script with the text file path
    const { stdout, stderr } = await execPromise(
      `python3 python/process_audio2.py ${wavFilePath}`
    );
    if (stderr) {
      throw new Error(stderr);
    }

    // Assuming the Python script outputs JSON directly to stdout
    const diarizationResults = JSON.parse(stdout);

    return diarizationResults;

    // Clean up files (adjust cleanup as per your needs)
    // setTimeout(async () => {
    //   try {
    //     await unlinkPromise(filePath); // Clean up uploaded text file
    //   } catch (err) {
    //     console.error('Error during file cleanup:', err);
    //   }
    // }, 3000);
  } catch (error) {
    console.log(error);
  }
};

module.exports = { transcribe, transcribe2 };
