package com.speech.volcengine;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.speech.protocol.EventType;
import com.speech.protocol.Message;
import com.speech.protocol.MsgType;
import com.speech.protocol.SpeechWebSocketClient;
import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Map;
import java.util.UUID;

@Slf4j
public class UnidirectionalStream {
    private static final String ENDPOINT = "wss://openspeech.bytedance.com/api/v3/tts/unidirectional/stream";
    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Get resource ID based on voice type
     *
     * @param voice Voice type string
     * @return Corresponding resource ID
     */
    public static String voiceToResourceId(String voice) {
        // Map different voice types to resource IDs based on actual needs
        if (voice.startsWith("S_")) {
            return "volc.megatts.default";
        }
        return "volc.service_type.10029";
    }

    public static void main(String[] args) throws Exception {
        // Configure parameters
        String appId = System.getProperty("appId");
        String accessToken = System.getProperty("accessToken");
        String voice = System.getProperty("voice", "");
        String text = System.getProperty("text", "");
        String encoding = System.getProperty("encoding", "wav");

        if (appId == null || accessToken == null) {
            log.error("Please set appId and accessToken system properties");
            System.exit(1);
        }

        // Set request headers
        Map<String, String> headers = Map.of(
                "X-Api-App-Key", appId,
                "X-Api-Access-Key", accessToken,
                "X-Api-Resource-Id", voiceToResourceId(voice),
                "X-Api-Connect-Id", UUID.randomUUID().toString());

        // Create WebSocket client
        SpeechWebSocketClient client = new SpeechWebSocketClient(new URI(ENDPOINT), headers);
        try {
            client.connectBlocking();
            // Prepare request parameters
            Map<String, Object> request = Map.of(
                    "user", Map.of("uid", UUID.randomUUID().toString()),
                    "req_params", Map.of(
                            "speaker", voice,
                            "audio_params", Map.of(
                                    "format", encoding,
                                    "sample_rate", 24000,
                                    "enable_timestamp", true),
                            // additions requires a JSON string
                            "additions", objectMapper.writeValueAsString(Map.of(
                                    "disable_markdown_filter", false)),
                            "text", text));

            // Send request
            client.sendFullClientMessage(objectMapper.writeValueAsBytes(request));

            // Receive response
            ByteArrayOutputStream audioStream = new ByteArrayOutputStream();
            while (true) {
                Message msg = client.receiveMessage();
                log.info("Received message: {}", msg);

                if (msg.getType() == MsgType.AUDIO_ONLY_SERVER) {
                    if (msg.getPayload() != null) {
                        audioStream.write(msg.getPayload());
                    }
                } else if (msg.getType() == MsgType.ERROR) {
                    throw new RuntimeException("Server returned error: " + new String(msg.getPayload()));
                }

                if (msg.getType() == MsgType.FULL_SERVER_RESPONSE &&
                        msg.getEvent() == EventType.TTS_SENTENCE_END) {
                    String jsonString = new String(msg.getPayload(), StandardCharsets.UTF_8);
                    log.info("Received TTS response sentence end: {}", jsonString);
                    continue;
                }

                if (msg.getType() == MsgType.FULL_SERVER_RESPONSE &&
                        msg.getEvent() == EventType.SESSION_FINISHED) {
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