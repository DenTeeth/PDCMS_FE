# CHATBOT FAQ WITH GEMINI AI - INTEGRATION GUIDE

## TỔNG QUAN HỆ THỐNG

Chatbot FAQ sử dụng Gemini AI để phân loại câu hỏi của người dùng và trả lời tự động. Hệ thống hoạt động theo mô hình hybrid:

1. Gemini AI phân loại câu hỏi vào ID kiến thức (GREETING, PRICE_LIST, SYMPTOM_TOOTHACHE, ADDRESS)
2. Backend lấy nội dung trả lời từ database (đảm bảo consistency)
3. Không cần authentication (public endpoint)

## KIẾN TRÚC HỆ THỐNG

```
User Message
    |
    v
Frontend --> POST /api/v1/chatbot/chat --> Backend
                                              |
                                              v
                                        ChatbotService
                                              |
                                              +---> Gemini AI (phân loại ID)
                                              |
                                              +---> PostgreSQL (lấy response)
                                              |
                                              v
                                          Response
```

## API SPECIFICATION

### POST /api/v1/chatbot/chat

Gửi tin nhắn đến chatbot và nhận câu trả lời.

**Endpoint**: `POST /api/v1/chatbot/chat`

**Headers**:

- `Content-Type: application/json`
- **KHÔNG CẦN** Authorization header (public endpoint)

**Request Body**:

```json
{
  "message": "xin chào"
}
```

**Response (200 OK)**:

```json
{
  "message": "Chào bạn! Mình là trợ lý ảo nha khoa. Mình có thể giúp bạn tra cứu bảng giá hoặc hướng dẫn khi bị đau răng.",
  "timestamp": "2025-12-22T03:30:00"
}
```

**Error Response (400 Bad Request)**:

```json
{
  "timestamp": "2025-12-22T03:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Tin nhắn không được để trống",
  "path": "/api/v1/chatbot/chat"
}
```

## KNOWLEDGE BASE (FAQ)

Hệ thống có 4 loại kiến thức cơ bản:

### 1. GREETING (Chào hỏi)

**Keywords**: xin chào, hi, hello, bạn ơi, alo, chào bạn, hey

**Response**:

```
Chào bạn! Mình là trợ lý ảo nha khoa. Mình có thể giúp bạn tra cứu bảng giá hoặc hướng dẫn khi bị đau răng.
```

### 2. PRICE_LIST (Bảng giá)

**Keywords**: bảng giá, giá bao nhiêu, bao nhiêu tiền, chi phí, giá cả, price, cost

**Response**:

```
Dạ bảng giá tham khảo bên mình:
- Cạo vôi: 200k
- Trám răng: 300k
- Nhổ răng: 500k-2tr.
Bạn muốn làm dịch vụ nào ạ?
```

### 3. SYMPTOM_TOOTHACHE (Đau răng)

**Keywords**: đau răng, nhức răng, sâu răng, ê buốt, toothache, đau nhức, răng đau

**Response**:

```
Nếu đau răng, bạn nên hạn chế đồ lạnh/nóng. Hãy ghé phòng khám để bác sĩ kiểm tra xem có bị sâu vào tủy không nhé. Phí khám là 100k ạ.
```

### 4. ADDRESS (Địa chỉ)

**Keywords**: địa chỉ, ở đâu, phòng khám chỗ nào, address, location, vị trí

**Response**:

```
ô E2a-7, Đường D1, Khu Công nghệ cao, Phường Tăng Nhơn Phú, TPHCM.
```

### 5. UNKNOWN (Không hiểu)

Khi câu hỏi không thuộc các category trên:

**Response**:

```
Dạ em chưa hiểu rõ ý mình lắm. Anh/Chị vui lòng gọi Hotline 0909.123.456 để được hỗ trợ ạ!
```

## FRONTEND INTEGRATION

### React/TypeScript Example

```typescript
import React, { useState } from "react";
import axios from "axios";

interface ChatMessage {
  text: string;
  sender: "user" | "bot";
  timestamp: string;
}

interface ChatResponse {
  message: string;
  timestamp: string;
}

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      text: input,
      sender: "user",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post<ChatResponse>(
        "http://localhost:8080/api/v1/chatbot/chat",
        { message: input }
      );

      // Add bot response
      const botMessage: ChatMessage = {
        text: response.data.message,
        sender: "bot",
        timestamp: response.data.timestamp,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMessage: ChatMessage = {
        text: "Dạ em đang gặp sự cố kỹ thuật. Vui lòng thử lại sau ạ!",
        sender: "bot",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <p>{msg.text}</p>
            <span className="timestamp">{msg.timestamp}</span>
          </div>
        ))}
        {loading && <div className="loading">Đang trả lời...</div>}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Nhập câu hỏi của bạn..."
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          Gửi
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
```

### Vue.js Example

```vue
<template>
  <div class="chatbot-container">
    <div class="chat-messages">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message', msg.sender]"
      >
        <p>{{ msg.text }}</p>
        <span class="timestamp">{{ msg.timestamp }}</span>
      </div>
      <div v-if="loading" class="loading">Đang trả lời...</div>
    </div>
    <div class="chat-input">
      <input
        v-model="input"
        @keyup.enter="sendMessage"
        placeholder="Nhập câu hỏi của bạn..."
      />
      <button @click="sendMessage" :disabled="loading || !input.trim()">
        Gửi
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import axios from "axios";

interface ChatMessage {
  text: string;
  sender: "user" | "bot";
  timestamp: string;
}

const messages = ref<ChatMessage[]>([]);
const input = ref("");
const loading = ref(false);

const sendMessage = async () => {
  if (!input.value.trim()) return;

  // Add user message
  messages.value.push({
    text: input.value,
    sender: "user",
    timestamp: new Date().toISOString(),
  });

  const userInput = input.value;
  input.value = "";
  loading.value = true;

  try {
    const response = await axios.post(
      "http://localhost:8080/api/v1/chatbot/chat",
      {
        message: userInput,
      }
    );

    // Add bot response
    messages.value.push({
      text: response.data.message,
      sender: "bot",
      timestamp: response.data.timestamp,
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    messages.value.push({
      text: "Dạ em đang gặp sự cố kỹ thuật. Vui lòng thử lại sau ạ!",
      sender: "bot",
      timestamp: new Date().toISOString(),
    });
  } finally {
    loading.value = false;
  }
};
</script>
```

## TEST SCENARIOS

### Test Case 1: GREETING

**Input**: "xin chào"
**Expected Output**: Chào hỏi và giới thiệu chatbot

### Test Case 2: PRICE_LIST

**Input**: "bảng giá bao nhiêu"
**Expected Output**: Bảng giá các dịch vụ

### Test Case 3: SYMPTOM_TOOTHACHE

**Input**: "tôi bị đau răng"
**Expected Output**: Hướng dẫn xử lý đau răng

### Test Case 4: ADDRESS

**Input**: "phòng khám ở đâu"
**Expected Output**: Địa chỉ phòng khám

### Test Case 5: UNKNOWN

**Input**: "thời tiết hôm nay thế nào"
**Expected Output**: Không hiểu, đề nghị gọi hotline

## TESTING GUIDE

### Manual Testing (curl)

```bash
# Test GREETING
curl -X POST http://localhost:8080/api/v1/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "xin chào"}'

# Test PRICE_LIST
curl -X POST http://localhost:8080/api/v1/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "bảng giá bao nhiêu"}'

# Test SYMPTOM_TOOTHACHE
curl -X POST http://localhost:8080/api/v1/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "tôi bị đau răng"}'

# Test ADDRESS
curl -X POST http://localhost:8080/api/v1/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "phòng khám ở đâu"}'

# Test UNKNOWN
curl -X POST http://localhost:8080/api/v1/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "thời tiết hôm nay thế nào"}'
```

### Automated Testing Script

Chạy script test tự động:

```bash
bash test_chatbot.sh
```

## CONFIGURATION

### Backend Configuration

File: `src/main/resources/application-dev.yaml`

```yaml
chatbot:
  gemini:
    api-key: ${GEMINI_API_KEY:AIzaSyDu-VZS88FHFAywrL-4dnqVInJhFwnbudU}
    model-name: ${GEMINI_MODEL_NAME:gemini-1.5-flash}
```

### Environment Variables

Có thể override qua environment variables:

```bash
export GEMINI_API_KEY=your-api-key-here
export GEMINI_MODEL_NAME=gemini-1.5-flash
```

## BUSINESS RULES

### BR-1: Public Access

- Chatbot API là public endpoint
- KHÔNG CẦN authentication
- Có thể truy cập từ website landing page

### BR-2: Rate Limiting

- Gemini free tier: 15 requests/minute
- Production nên implement rate limiting ở API Gateway

### BR-3: Fallback Response

- Nếu Gemini API lỗi: Trả về "Dạ em đang gặp sự cố kỹ thuật..."
- Nếu không hiểu câu hỏi: Trả về "Dạ em chưa hiểu rõ ý..."

### BR-4: Response Consistency

- Nội dung trả lời LUÔN lấy từ database
- Gemini CHỈ phân loại ID, KHÔNG generate response
- Đảm bảo accuracy và compliance

## TECHNICAL NOTES

### Gemini AI Configuration

- Model: `gemini-1.5-flash` (fast, cost-effective)
- Temperature: `0.0` (deterministic, no creativity)
- Prompt engineering: Classification task (chỉ trả về ID)

### Database Schema

```sql
CREATE TABLE chatbot_knowledge (
    knowledge_id VARCHAR(50) PRIMARY KEY,
    keywords TEXT NOT NULL,
    response TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
```

### Dependencies

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-google-ai-gemini</artifactId>
    <version>0.35.0</version>
</dependency>
```

## TROUBLESHOOTING

### Issue 1: Gemini API Error

**Symptom**: Response "Dạ em đang gặp sự cố kỹ thuật..."

**Solution**:

1. Kiểm tra API key còn valid không
2. Kiểm tra quota (15 req/min)
3. Xem logs: `com.dental.clinic.management.chatbot.service.ChatbotService`

### Issue 2: Empty Response

**Symptom**: Response trống hoặc null

**Solution**:

1. Kiểm tra database có data trong `chatbot_knowledge` không
2. Verify seed data đã chạy: `SELECT * FROM chatbot_knowledge;`

### Issue 3: CORS Error

**Symptom**: Frontend không gọi được API

**Solution**:
API đã config CORS cho localhost. Nếu cần thêm origin:

```yaml
app:
  cors:
    allowed-origins: http://localhost:3000,http://your-domain.com
```

## PERFORMANCE CONSIDERATIONS

### Response Time

- Gemini API call: ~500ms-1s
- Database query: <10ms
- Total: ~500ms-1s

### Optimization

- Có thể cache mapping (user message → ID) trong Redis
- Gemini quota limited → xem xét hybrid approach:
  - Simple keywords → direct match (không cần Gemini)
  - Complex questions → Gemini classification

## SECURITY NOTES

### API Key Management

- API key lưu trong environment variable
- KHÔNG commit API key vào Git
- Production: Dùng Secret Manager (AWS Secrets Manager, Google Secret Manager)

### Input Validation

- Backend validate message không empty
- Frontend trim whitespace
- Max length: Không giới hạn (Gemini handle long text)

## MONITORING & LOGGING

### Logs to Monitor

```java
log.info("User message: '{}' -> Detected ID: '{}'", userMessage, detectedId);
log.error("Gemini API error: {}", e.getMessage());
```

### Metrics to Track

- Gemini API call duration
- Classification accuracy (ID detection rate)
- Unknown response rate
- Error rate

## FUTURE ENHANCEMENTS

### Phase 2 Ideas

1. Multi-turn conversation (context memory)
2. Book appointment directly from chat
3. Check appointment status
4. Personalized responses (based on patient history)
5. Voice input/output
6. Multi-language support (English, Vietnamese)

---

**Document Version**: 1.0
**Last Updated**: December 22, 2025
**Author**: Dental Clinic Development Team
**Verified Against**: ChatbotController.java, ChatbotService.java, dental-clinic-seed-data.sql
