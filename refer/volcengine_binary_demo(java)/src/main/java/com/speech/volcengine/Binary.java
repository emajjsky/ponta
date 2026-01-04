package com.speech.volcengine;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.speech.protocol.Message;
import com.speech.protocol.MsgType;
import com.speech.protocol.SpeechWebSocketClient;
import lombok.extern.slf4j.Slf4j;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.net.URI;
import java.nio.file.Files;
import java.util.Map;
import java.util.UUID;

@Deprecated // Not recommended, for unidirectional streaming TTS, please use
            // UnidirectionalTTSExample
@Slf4j
public class Binary {
    private static final String ENDPOINT = "wss://openspeech.bytedance.com/api/v1/tts/ws_binary";
    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Get resource ID based on voice type
     *
     * @param voice Voice type string
     * @return Corresponding resource ID
     */
    public static String voiceToCluster(String voice) {
        // Map different voice types to resource IDs based on actual needs
        if (voice.startsWith("S_")) {
            return "volcano_icl";
        }
        return "volcano_tts";
    }

    public static void main(String[] args) throws Exception {
        // Configure parameters
        String appId = System.getProperty("appId");
        String accessToken = System.getProperty("accessToken");
        String cluster = System.getProperty("cluster", "");
        String voice = System.getProperty("voice", "");
        String text = System.getProperty("text", "");
        String encoding = System.getProperty("encoding", "mp3");

        if (appId == null || accessToken == null) {
            log.error("Please set appId and accessToken system properties");
            System.exit(1);
        }

        // Set request headers
        Map<String, String> headers = Map.of(
                "Authorization", String.format("Bearer;%s", accessToken));

        // Create WebSocket client
        SpeechWebSocketClient client = new SpeechWebSocketClient(new URI(ENDPOINT), headers);
        try {
            client.connectBlocking();
            // Prepare request parameters
            Map<String, Object> request = Map.of(
                    "app", Map.of(
                            "appid", appId,
                            "token", accessToken,
                            "cluster", cluster.isEmpty() ? voiceToCluster(voice) : cluster),
                    "user", Map.of(
                            "uid", UUID.randomUUID().toString()),
                    "audio", Map.of(
                            "voice_type", voice,
                            "encoding", encoding),
                    "request", Map.of(
                            "reqid", UUID.randomUUID().toString(),
                            "text", text,
                            "operation", "submit",
                            "text_type", "plain",
                            "with_timestamp", "1",
                            // extra_param requires a JSON string
                            "extra_param", objectMapper.writeValueAsString(Map.of(
                                    "disable_markdown_filter", false))));

            // Send request
            client.sendFullClientMessage(objectMapper.writeValueAsBytes(request));

            // Receive response
            ByteArrayOutputStream audioStream = new ByteArrayOutputStream();
            while (true) {
                Message msg = client.receiveMessage();
                log.info("Received message: {}", msg);
                switch (msg.getType()) {
                    case MsgType.AUDIO_ONLY_SERVER:
                        if (msg.getPayload() != null) {
                            audioStream.write(msg.getPayload());
                        }
                        break;
                    case MsgType.FRONT_END_RESULT_SERVER:
                        break;
                    default:
                        throw new RuntimeException("Unexpected message: " + msg);
                }
                if (msg.getType() == MsgType.AUDIO_ONLY_SERVER && msg.getSequence() < 0) {
                    break;
                }
            }

            if (audioStream.size() == 0) {
                throw new RuntimeException("No audio data received");
            }

            // Save audio file
            String fileName = String.format("%s.%s", voice, encoding);
            Files.write(new File(fileName).toPath(), audioStream.toByteArray());
            log.info("Audio saved to file: {}", fileName);
        } finally {
            client.closeBlocking();
        }
    }
}