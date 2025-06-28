# Skye Weather App Roadmap (Streamlined)

A simple, quick-win implementation plan for the Skye weather app, focusing on core weather features, offline support, and audio (TTS) integration.

---

## 1. Project Setup
- [ ] Initialize React Native (Expo) project
- [ ] Set up TypeScript and ESLint
- [ ] Install dependencies: OpenWeatherMap API, react-native-tts, AsyncStorage

## 2. Core Features (MVP)
- [ ] Get device location (geolocation)
- [ ] Fetch and display current weather (city, temp, summary, icon)
- [ ] Basic 5-day forecast (list or cards)
- [ ] Simple, clean dashboard UI (prioritize clarity and quick access)

## 3. Quick Wins & Offline Support
- [ ] Cache last weather data in AsyncStorage for offline viewing
- [ ] Add refresh button for manual update
- [ ] Show 'last updated' timestamp

## 4. Audio (TTS) Integration
- [ ] Add 'Speak Weather' button (uses react-native-tts to read out current weather)
- [ ] Optionally, auto-read weather on app open

## 5. Polish & Usability
- [ ] Error/loading states for API and location
- [ ] Minimal settings (units: C/F, TTS on/off)
- [ ] Responsive, aesthetic UI (but keep it simple)

---

**Notes:**
- No backend: all data from OpenWeatherMap API, TTS and caching are client-side.
- Focus on quick, tangible wins and core user value.
- Showcase: API integration, TTS/audio, offline support, and clean UI. 