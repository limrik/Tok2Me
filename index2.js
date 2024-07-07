'use strict';
const lark = require('@larksuiteoapi/node-sdk');
const axios = require('axios');
const Hapi = require('@hapi/hapi');
const fs = require('fs');
const { transcribe2 } = require('./app');
require('dotenv').config();

const tokenData = {
  app_id: process.env.APP_ID,
  app_secret: process.env.APP_SECRET,
};
const client = new lark.Client({
  appId: process.env.APP_ID,
  appSecret: process.env.APP_SECRET,
});

let headers = {
  Authorization: '',
  'Content-Type': 'application/json',
};

const getNewToken = async () => {
  const tokenUrl =
    'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal/';
  try {
    const response = await axios.post(tokenUrl, tokenData, {
      headers: { 'Content-Type': 'application/json' },
    });
    const newToken = response.data.tenant_access_token;
    headers.Authorization = `Bearer ${newToken}`;
    console.log('New token obtained:', newToken);
  } catch (error) {
    console.error('Error obtaining new token:', error.message);
    throw new Error('Unable to refresh token');
  }
};

const sendMessage = async (chat_id, text) => {
  try {
    const response = await client.im.message.create({
      params: {
        receive_id_type: 'chat_id',
      },
      data: {
        receive_id: chat_id,
        content: JSON.stringify({
          text: text,
        }),
        msg_type: 'text',
      },
    });
    console.log('Message sent:', response);
  } catch (err) {
    console.error('Error sending message:', err);
  }
};

const sendMessageToUser = async (open_id, text) => {
  try {
    const response = await client.im.message.create({
      params: {
        receive_id_type: 'open_id',
      },
      data: {
        receive_id: open_id,
        content: JSON.stringify({
          text: text,
        }),
        msg_type: 'text',
      },
    });
    console.log('Message sent:', response);
  } catch (err) {
    console.error('Error sending message:', err);
  }
};

const sendCard = async (chat_id, fileName, summary, keywords, tasks) => {
  const taskElements = tasks
    .map((task, index) => `${index + 1}. ${task}`)
    .join('\\n');
  console.log(taskElements);
  try {
    const response = await client.im.message.create({
      params: {
        receive_id_type: 'chat_id',
      },
      data: {
        receive_id: chat_id,
        content: `{"config":{"wide_screen_mode":true},"elements":[{"tag":"markdown","content":"**Summary**: ${summary} \\n**Tasks**:\\n${taskElements} \\n**Keywords**: ${keywords}"}],"header":{"template":"blue","title":{"content":"${fileName}","tag":"plain_text"}}}`,
        msg_type: 'interactive',
      },
    });
    console.log('Card sent:', response);
  } catch (err) {
    console.error('Error sending card:', err);
  }
};

const createTaskList = async (userId, meetingName) => {
  const url = 'https://open.larksuite.com/open-apis/task/v2/tasklists';
  try {
    const response = await axios.post(
      url,
      {
        name: meetingName,
        members: [
          {
            id: userId,
            type: 'user',
            role: 'editor',
          },
        ],
      },
      {
        headers,
      }
    );
    console.log('Task list created:', response.data);
  } catch (error) {
    console.error('Error creating task list:', error.message);
  }
};

const getTaskLists = async () => {
  const url = 'https://open.larksuite.com/open-apis/task/v2/tasklists';
  try {
    const response = await axios.get(url, { headers });
    // console.log('Task lists:', response.data.data.items);
    return response.data.data.items;
  } catch (error) {
    console.error('Error getting task lists:', error.message);
  }
};

const findTaskListByName = (taskLists, videoName) => {
  for (const taskList of taskLists) {
    if (taskList.name === videoName) {
      return taskList.guid;
    }
  }
  return null;
};

const createTask = async (name) => {
  const url = 'https://open.larksuite.com/open-apis/task/v2/tasks';
  try {
    const response = await axios.post(
      url,
      {
        summary: name,
      },
      {
        headers,
      }
    );
    console.log('Task created:', response.data);
    return response.data.data.task.guid;
  } catch (error) {
    console.error('Error creating Task:', error.message);
  }
};

const addTaskToTaskList = async (task_guid, tasklist_guid) => {
  const url = `https://open.larksuite.com/open-apis/task/v2/tasks/${task_guid}/add_tasklist`;
  try {
    const response = await axios.post(
      url,
      {
        tasklist_guid: tasklist_guid,
      },
      {
        headers,
      }
    );
    console.log('Task added to Task List created:', response.data);
  } catch (error) {
    console.error('Error adding Task to Task List:', error);
  }
};

const downloadFile = async (messageId, fileKey) => {
  const url = `https://open.larksuite.com/open-apis/im/v1/messages/${messageId}/resources/${fileKey}?type=file`;
  const filePath = `./videos/${fileKey}.txt`;
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream', // Set responseType to 'stream' to handle binary data
      headers: headers, // Make sure headers are defined appropriately
    });

    // Pipe the response data stream directly to a file
    response.data.pipe(fs.createWriteStream(filePath));

    // Return a promise to indicate completion or handle further actions
    return new Promise((resolve, reject) => {
      response.data.on('end', () => {
        console.log('file downloaded');
        resolve(filePath);
      });
      response.data.on('error', (err) => {
        console.error('Error downloading file:', err);
        reject(err);
      });
    });
  } catch (error) {
    console.error('Error downloading file:', error);
  }
};

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
  });

  server.route({
    method: 'POST',
    path: '/',
    handler: async (request, h) => {
      const data = request.payload;

      if (data.type === 'url_verification') {
        // Respond immediately to url_verification event
        return h.response({ challenge: data.challenge }).code(200);
      }

      if (data.header.event_type === 'im.message.receive_v1') {
        console.log('Received im.message.receive_v1 event:', data);
        const chat_id = data.event.message.chat_id;

        // Acknowledge receipt immediately
        h.response().code(200);

        // if (
        //   data.event.message.mentions &&
        //   data.event.message.mentions.some(
        //     (mention) => mention.name === 'Tok2Me'
        //   )
        // ) {
        //   // Send a message asynchronously
        //   await sendMessage(chat_id, 'Please upload an audio file');
        //   return h.response().code(200);
        // }

        if (data.event.message.message_type === 'file') {
          console.log('Received media message:', data.event.message);
          // Process media asynchronously
          await processMedia(data.event.message, h);

          return h.response().code(200);
        }

        return h.response().code(200);
      }

      if (data.header.event_type === 'vc.meeting.all_meeting_started_v1') {
        console.log('Meeting started:', data.event.meeting.id);
        return h.response().code(200);
      }

      if (data.header.event_type === 'vc.meeting.all_meeting_ended_v1') {
        console.log('Meeting ended:', data.event.meeting.id);
        const open_id = data.event.meeting.owner.id.open_id;
        // Handle meeting ended event asynchronously
        const vidUrl = await handleMeetingEnd(data.event, h);
        console.log('vidUrl: ', vidUrl);
        await sendMessageToUser(
          open_id,
          `Your recent meeting has been successfully processed, please download the transcript from ${vidUrl} and upload it here`
        );

        return h.response().code(200);
      }

      return h.response('Unsupported request type').code(400);
    },
  });

  await server.start();
  console.log('Server running on %s', server.info.uri);
};

// Asynchronous function to process media
async function processMedia(mediaEvent, h) {
  const videoName = JSON.parse(mediaEvent.content).file_name.replace(
    '.txt',
    ''
  );
  console.log('videoName:', videoName);
  const messageId = mediaEvent.message_id;
  const fileKey = JSON.parse(mediaEvent.content).file_key;

  await getNewToken();
  await downloadFile(messageId, fileKey);

  const filePath = `./videos/${fileKey}.txt`;
  const result = await transcribe2(filePath, fileKey, h);

  console.log('Transcription result:', result);

  // Send user a card asynchronously
  console.log(mediaEvent);
  const fileName = JSON.parse(mediaEvent.content).file_name.replace('.txt', '');
  await sendCard(
    mediaEvent.chat_id,
    fileName,
    result.summary,
    result.keywords,
    result.tasks
  );

  // Asynchronous tasks after transcription
  await handleTaskOperations(videoName, result.tasks);

  console.log(result.summary, result.keywords, result.tasks);
}

// Example asynchronous function to handle meeting end event
async function handleMeetingEnd(event, h) {
  const meetingId = event.meeting.id;
  const userId = event.operator.id.open_id;
  const meetingName = event.meeting.topic;

  await getNewToken();

  // Create task list asynchronously
  await createTaskList(userId, meetingName);

  // Wait for 60 seconds before fetching the recording files
  await new Promise((resolve) => setTimeout(resolve, 60000));

  // Handle meeting recording asynchronously
  const vidUrl = await getRecordingFiles(meetingId);
  console.log('handleMeetingEnd: ', vidUrl);
  return vidUrl;
}

// Example function to handle task operations asynchronously
async function handleTaskOperations(videoName, tasks) {
  // Find task list asynchronously
  const taskLists = await getTaskLists();
  const taskListGuid = findTaskListByName(taskLists, videoName);
  console.log('taskLists:', taskLists);
  console.log('videoName:', videoName);
  console.log('taskListGuid:', taskListGuid);

  if (taskListGuid) {
    console.log(`Task found with GUID: ${taskListGuid}`);
    // Create task asynchronously
    for (const task of tasks) {
      const taskGuid = await createTask(task);
      console.log(`Task created with GUID: ${taskGuid}`);
      // Add task to task list asynchronously
      setTimeout(() => addTaskToTaskList(String(taskGuid), taskListGuid), 5000);
    }
  } else {
    console.log('Task list not found');
  }
}

async function getRecordingFiles(meetingId) {
  const url = `https://open.larksuite.com/open-apis/vc/v1/meetings/${meetingId}/recording`;

  try {
    const response = await axios.get(url, { headers });
    console.log('Recording files:', response.data.data.recording.url);
    return response.data.data.recording.url;
  } catch (error) {
    console.error('Error getting files:', error.message);
  }
}

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
