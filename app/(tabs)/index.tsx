import React, { useState, useRef } from "react";
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, KeyboardAvoidingView, Platform 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { streamDivaResponse } from "../../services/gemini";

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: "1", role: "model", text: "Look who decided to show up. What's on your mind today?" }
  ]);
  const [inputText, setInputText] = useState("");
  const [persona, setPersona] = useState("cozy");
  const [isTyping, setIsTyping] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMsg = { id: Date.now().toString(), role: "user", text: inputText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText("");
    setIsTyping(true);

    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: "model", text: "" }]);

    try {
      const stream = streamDivaResponse(messages, userMsg.text, persona);
      let accumulatedText = "";
      for await (const chunk of stream) {
        accumulatedText += chunk;
        setMessages(prev => 
          prev.map(msg => msg.id === aiMsgId ? { ...msg, text: accumulatedText } : msg)
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Diva AI</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.chatArea}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.messageScroll}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((item) => (
            <View 
              key={item.id} 
              style={[
                styles.bubble, 
                item.role === "user" ? styles.userBubble : styles.aiBubble
              ]}
            >
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          ))}
          {isTyping && (
            <View style={[styles.bubble, styles.aiBubble]}>
              <Text style={styles.typingText}>Diva is typing...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Say something to Diva..."
            placeholderTextColor="#666"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0C" },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#1A1A1E", alignItems: "center" },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
  chatArea: { flex: 1 },
  messageScroll: { padding: 16, gap: 12 },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 16 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#6C5CE7", borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: "flex-start", backgroundColor: "#1E1E24", borderBottomLeftRadius: 4 },
  messageText: { color: "#FFF", fontSize: 15, lineHeight: 22 },
  typingText: { color: "#888", fontStyle: "italic" },
  inputContainer: { flexDirection: "row", padding: 12, backgroundColor: "#0A0A0C", borderTopWidth: 1, borderTopColor: "#1A1A1E", alignItems: "center", gap: 8 },
  textInput: { flex: 1, backgroundColor: "#16161A", color: "#FFF", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, fontSize: 15 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#6C5CE7", justifyContent: "center", alignItems: "center" },
  sendButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" }
});
