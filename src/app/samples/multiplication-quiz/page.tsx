"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { usePageTitle } from "@/contexts/PageTitleContext";

interface Question {
  a: number;
  b: number;
  answer: number;
}

interface QuizResult {
  correct: number;
  total: number;
  percentage: number;
}

type GameState = "setup" | "permission" | "quiz" | "result";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function MultiplicationQuizPage() {
  const { setPageTitle } = usePageTitle();
  const [gameState, setGameState] = useState<GameState>("setup");
  const [questionCount, setQuestionCount] = useState<string>("10");
  const [timeLimit, setTimeLimit] = useState<number>(3); // 제한시간 (초), 0은 무제한
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(10);
  const [timerActive, setTimerActive] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingSpeechRef = useRef<boolean>(false); // 음성 인식 처리 중 플래그
  const isListeningRef = useRef<boolean>(false); // 음성 인식 리스닝 상태 ref
  const currentStateRef = useRef({ currentQuestionIndex: 0, questions: [] as Question[], showFeedback: false });
  const submitAnswerRef = useRef<((answer: string) => void) | null>(null);

  useEffect(() => {
    setPageTitle("곱셈구구", "음성으로 답하는 구구단 게임");
  }, [setPageTitle]);

  // 한국어 숫자를 아라비아 숫자로 변환하는 함수
  const convertKoreanToNumber = (text: string): number | null => {
    // 한국어 숫자 매핑
    const koreanNumbers: { [key: string]: number } = {
      영: 0,
      공: 0,
      제로: 0,
      zero: 0,
      일: 1,
      하나: 1,
      한: 1,
      one: 1,
      이: 2,
      둘: 2,
      two: 2,
      삼: 3,
      셋: 3,
      three: 3,
      사: 4,
      넷: 4,
      four: 4,
      오: 5,
      다섯: 5,
      five: 5,
      육: 6,
      여섯: 6,
      six: 6,
      칠: 7,
      일곱: 7,
      seven: 7,
      팔: 8,
      여덟: 8,
      eight: 8,
      구: 9,
      아홉: 9,
      nine: 9,
      십: 10,
      열: 10,
      ten: 10,
      십일: 11,
      열하나: 11,
      십이: 12,
      열둘: 12,
      십삼: 13,
      열셋: 13,
      십사: 14,
      열넷: 14,
      십오: 15,
      열다섯: 15,
      십육: 16,
      열여섯: 16,
      십칠: 17,
      열일곱: 17,
      십팔: 18,
      열여덟: 18,
      십구: 19,
      열아홉: 19,
      이십: 20,
      스무: 20,
      스물: 20,
      twenty: 20,
      이십일: 21,
      스물하나: 21,
      이십이: 22,
      스물둘: 22,
      이십삼: 23,
      스물셋: 23,
      이십사: 24,
      스물넷: 24,
      twentyfour: 24,
      이십오: 25,
      스물다섯: 25,
      이십육: 26,
      스물여섯: 26,
      이십칠: 27,
      스물일곱: 27,
      이십팔: 28,
      스물여덟: 28,
      이십구: 29,
      스물아홉: 29,
      삼십: 30,
      서른: 30,
      thirty: 30,
      삼십육: 36,
      서른여섯: 36,
      사십: 40,
      마흔: 40,
      forty: 40,
      사십이: 42,
      마흔둘: 42,
      사십오: 45,
      마흔다섯: 45,
      사십팔: 48,
      마흔여덟: 48,
      오십: 50,
      쉰: 50,
      오십사: 54,
      쉰넷: 54,
      육십: 60,
      예순: 60,
      육십삼: 63,
      예순셋: 63,
      칠십: 70,
      일흔: 70,
      칠십이: 72,
      일흔둘: 72,
      팔십: 80,
      여든: 80,
      팔십일: 81,
      여든하나: 81,
    };

    // 입력 텍스트 정리 - 먼저 아라비아 숫자 확인
    // 먼저 아라비아 숫자 추출 시도 (원본에서)
    const arabicMatch = text.match(/\d+/);
    if (arabicMatch) {
      return parseInt(arabicMatch[0]);
    }

    // 한국어 텍스트 정리
    const cleanText = text.replace(/[^\w가-힣]/g, "").toLowerCase();

    // 한국어 숫자 직접 매칭
    if (koreanNumbers.hasOwnProperty(cleanText)) {
      return koreanNumbers[cleanText];
    }

    return null;
  };

  // 음성 인식 결과에서 숫자 추출 및 검증 (0-81 범위 제한: 구구단 최대값)
  const extractAndValidateNumber = (transcript: string): string => {
    const number = convertKoreanToNumber(transcript);

    if (number !== null && number >= 0 && number <= 81) {
      return number.toString();
    }

    // 원본 텍스트에서 아라비아 숫자만 추출 시도
    const numbersOnly = transcript.match(/\d+/g);
    if (numbersOnly && numbersOnly.length > 0) {
      const extractedNumber = parseInt(numbersOnly[0]);
      if (extractedNumber >= 0 && extractedNumber <= 81) {
        return extractedNumber.toString();
      }
    }

    // 숫자를 찾지 못한 경우 원본 텍스트 반환 (사용자가 확인할 수 있도록)
    return transcript;
  };

  // 타이머 시작
  const startTimer = () => {
    // 제한시간이 0(무제한)이면 타이머를 시작하지 않음
    if (timeLimit === 0) {
      setTimerActive(false);
      return;
    }

    // 기존 타이머가 있다면 정리
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setTimeLeft(timeLimit);
    setTimerActive(true);

    // 로컬 변수 사용으로 state 업데이트 지연 문제 해결
    // setInterval 콜백에서 state를 참조하면 closure로 인해 초기값만 참조되는 문제 발생
    let currentTime = timeLimit;
    timerRef.current = setInterval(() => {
      currentTime -= 1;
      setTimeLeft(currentTime);

      if (currentTime <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setTimerActive(false);

        // 타이머가 0이 되어도 즉시 타임아웃 처리하지 않고 2초 유예 시간 부여
        // 이 시간 동안 음성 인식이 완료되면 정답 처리 가능
        // 사용자 경험: 3초 제한 → 실제로는 5초까지 답변 가능
        setTimeout(() => {
          handleTimeUp();
        }, 2000);
      }
    }, 1000);
  };

  // 타이머 중지
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimerActive(false);
  };

  // 시간 초과 처리 (타이머 만료 시 자동 오답 처리)
  const handleTimeUp = () => {
    // ref에서 현재 상태 가져오기
    const {
      currentQuestionIndex: currentIndex,
      questions: currentQuestions,
      showFeedback: currentShowFeedback,
    } = currentStateRef.current;

    // 이미 피드백이 표시되고 있다면 (답안이 이미 제출됨) 처리하지 않음
    if (currentShowFeedback) {
      return;
    }

    // 타이머에서 1초 유예를 이미 부여했으므로 여기서는 즉시 처리
    // 단, 답안이 제출된 경우는 제외

    stopTimer();

    // 음성 인식 중단 (ref 사용)
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.abort();
        setIsListening(false);
        isListeningRef.current = false;
      } catch (e) {
        // 중단 실패 무시
      }
    }

    setUserAnswer("시간 초과");
    setIsCorrect(false);
    setShowFeedback(true);

    // 효과음 재생
    playWrongSound();

    // 2초 후 다음 문제로
    setTimeout(() => {
      setShowFeedback(false);
      if (currentIndex + 1 < currentQuestions.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setUserAnswer("");
        startTimer();
        // 음성 인식도 자동 시작
        if (speechSupported && !showTextInput && micPermissionGranted) {
          setTimeout(() => startListening(), 100);
        }
      } else {
        setGameState("result");
      }
    }, 2000);
  };

  // Web Audio API를 사용한 효과음 생성
  const playCorrectSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
      oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1); // C#6 note

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      // Web Audio API를 지원하지 않는 브라우저에서는 무시
    }
  };

  const playWrongSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3 note
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.1); // Lower note

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      // Web Audio API를 지원하지 않는 브라우저에서는 무시
    }
  };

  // 마이크 권한 상태 확인
  const checkMicrophonePermission = async () => {
    try {
      // navigator.permissions API 사용 (지원되는 브라우저에서만)
      if ("permissions" in navigator) {
        const permission = await navigator.permissions.query({ name: "microphone" as PermissionName });
        if (permission.state === "granted") {
          setMicPermissionGranted(true);
          return true;
        }
      }

      // 대체 방법: MediaDevices API로 간접 확인
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop()); // 즉시 스트림 정리
        setMicPermissionGranted(true);
        return true;
      } catch (error) {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  // 브라우저 호환성 검사 및 음성 인식 초기화
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setShowTextInput(true);
      return;
    }

    // 컴포넌트 마운트 시 마이크 권한 상태 확인
    checkMicrophonePermission().catch(() => {
      // 권한 확인 실패 시 기본값 유지 (micPermissionGranted = false)
    });

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
      // 음성 인식 처리 시작
      isProcessingSpeechRef.current = true;

      // 여러 대안 중 가장 좋은 결과 찾기
      let bestTranscript = "";
      let bestConfidence = 0;

      for (let i = 0; i < event.results[0].length; i++) {
        const alternative = event.results[0][i];
        if (alternative.confidence > bestConfidence) {
          bestTranscript = alternative.transcript;
          bestConfidence = alternative.confidence;
        }
      }

      const transcript = bestTranscript.trim();
      const extractedNumber = extractAndValidateNumber(transcript);

      setUserAnswer(extractedNumber);
      setIsListening(false);
      isListeningRef.current = false;
      setErrorMessage("");

      // 유효한 숫자가 추출된 경우 자동으로 제출
      const numberValue = parseInt(extractedNumber);
      if (!isNaN(numberValue) && numberValue >= 0 && numberValue <= 81) {
        // 타이머 중지 (즉시 중지하여 handleTimeUp 실행 방지)
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setTimerActive(false);

        // 음성 인식 완료 후 즉시 제출 (대기 시간 제거)
        const currentShowFeedback = currentStateRef.current.showFeedback;
        if (!currentShowFeedback && submitAnswerRef.current) {
          submitAnswerRef.current(extractedNumber);
        }
      }

      // 음성 인식 처리 완료
      isProcessingSpeechRef.current = false;
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      isListeningRef.current = false;
      isProcessingSpeechRef.current = false; // 에러 발생 시에도 플래그 해제
      handleSpeechError(event.error);
    };

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      // 플래그는 onresult에서만 설정 (실제 결과를 받았을 때만)
    };

    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
      isProcessingSpeechRef.current = false; // 음성 인식 종료 시 플래그 해제
    };

    recognitionRef.current = recognition;

    // 효과음은 Web Audio API로 생성하여 호환성 문제 해결
    // Data URI 방식 대신 간단한 beep 소리 사용

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      // 타이머 정리
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 상태 ref 업데이트
  useEffect(() => {
    currentStateRef.current = {
      currentQuestionIndex,
      questions,
      showFeedback,
    };
  }, [currentQuestionIndex, questions, showFeedback]);

  // 음성 인식 에러 처리
  const handleSpeechError = (error: string) => {
    switch (error) {
      case "not-allowed":
        setErrorMessage("🚫 마이크 접근이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.");
        setShowTextInput(true);
        break;
      case "no-speech":
        setErrorMessage("🔇 음성이 감지되지 않았습니다. 마이크가 제대로 작동하는지 확인하고 다시 시도해주세요.");
        // 자동으로 텍스트 입력 모드로 전환하지 않음
        break;
      case "audio-capture":
        setErrorMessage("🎤 마이크에 문제가 있습니다. 마이크 연결과 설정을 확인해주세요.");
        setShowTextInput(true);
        break;
      case "network":
        setErrorMessage("🌐 네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.");
        break;
      case "service-not-allowed":
        setErrorMessage("🚫 음성 인식 서비스가 허용되지 않았습니다.");
        setShowTextInput(true);
        break;
      case "bad-grammar":
        setErrorMessage("📝 음성 인식 설정에 문제가 있습니다.");
        break;
      case "language-not-supported":
        setErrorMessage("🗣️ 한국어 음성 인식이 지원되지 않는 브라우저입니다.");
        setShowTextInput(true);
        break;
      case "aborted":
        // 사용자가 중단한 경우 - 에러 메시지 표시하지 않음
        break;
      default:
        setErrorMessage(`❓ 음성 인식 중 오류가 발생했습니다. (${error}) 텍스트 입력을 사용해주세요.`);
        break;
    }
  };

  // 마이크 권한 요청
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 권한 확인 후 즉시 스트림 정리
      stream.getTracks().forEach((track) => track.stop());

      setMicPermissionGranted(true);
      setGameState("quiz");
      setErrorMessage("");

      // 첫 번째 문제에서 타이머와 음성 인식 자동 시작
      startTimer();
      if (speechSupported && recognitionRef.current) {
        setTimeout(() => startListening(), 100); // 음성 인식만 약간 지연
      }
    } catch (error) {
      setErrorMessage("마이크 권한이 필요합니다. 브라우저 설정에서 마이크 접근을 허용해주세요.");
      setShowTextInput(true);
      setGameState("quiz");
    }
  };

  // 구구단 문제 생성
  const generateQuestions = (count: number): Question[] => {
    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
      const a = Math.floor(Math.random() * 8) + 2; // 2-9
      const b = Math.floor(Math.random() * 8) + 2; // 2-9
      questions.push({
        a,
        b,
        answer: a * b,
      });
    }
    return questions;
  };

  // 퀴즈 시작
  const startQuiz = () => {
    const count = parseInt(questionCount);
    if (isNaN(count) || count < 1 || count > 100) {
      alert("1부터 100까지의 숫자를 입력해주세요.");
      return;
    }

    const newQuestions = generateQuestions(count);
    setQuestions(newQuestions);
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setUserAnswer("");
    setErrorMessage("");

    // 음성 인식이 지원되는 경우 권한 상태에 따라 처리
    if (speechSupported) {
      if (micPermissionGranted) {
        // 이미 권한이 있는 경우 바로 퀴즈 시작
        setGameState("quiz");
        // 타이머와 음성 인식 자동 시작
        startTimer();
        if (speechSupported && recognitionRef.current) {
          setTimeout(() => startListening(), 100);
        }
      } else {
        // 권한이 없는 경우 권한 요청 화면으로
        setGameState("permission");
      }
    } else {
      setShowTextInput(true);
      setGameState("quiz");
      // 음성 인식이 지원되지 않는 경우에도 타이머 시작
      startTimer();
    }
  };

  // 음성 인식 시작/중단
  const startListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      return;
    }

    if (isListeningRef.current) {
      // 현재 듣고 있으면 중단
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // 무시
      }
      setIsListening(false);
      isListeningRef.current = false;
      return;
    }

    setUserAnswer("");
    setErrorMessage("");

    try {
      // 먼저 중단 시도 (이미 실행 중일 수 있음)
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // 중단 실패는 무시 (이미 중지된 상태일 수 있음)
      }

      // 잠시 대기 후 시작
      setTimeout(() => {
        try {
          setIsListening(true);
          isListeningRef.current = true;
          recognitionRef.current.start();
        } catch (error) {
          console.error("음성 인식 시작 오류:", error);
          setIsListening(false);
          isListeningRef.current = false;
          setErrorMessage("음성 인식을 시작할 수 없습니다.");
        }
      }, 50);
    } catch (error) {
      console.error("음성 인식 초기화 오류:", error);
      setIsListening(false);
      isListeningRef.current = false;
    }
  };

  // 답안 제출 (매개변수로 답안을 전달받을 수 있음)
  const submitAnswerWithValue = (answerValue?: string) => {
    const answer = answerValue || userAnswer;

    if (!answer.trim()) {
      return;
    }

    // 이미 피드백이 표시되고 있다면 (중복 호출 방지) 처리하지 않음
    // ref에서 최신 상태 확인
    const currentShowFeedback = currentStateRef.current.showFeedback;
    if (currentShowFeedback) {
      return;
    }

    // 타이머 중지
    stopTimer();

    const currentQuestion = questions[currentQuestionIndex];

    // 숫자 추출 - 이미 숫자인지 확인하고, 아니면 변환 시도
    let userAnswerNum: number;
    const directNumber = parseInt(answer);

    if (!isNaN(directNumber)) {
      userAnswerNum = directNumber;
    } else {
      // 한국어 숫자 변환 시도
      const convertedNumber = convertKoreanToNumber(answer);
      userAnswerNum = convertedNumber || parseInt(answer.replace(/[^0-9]/g, "")) || 0;
    }

    const correct = userAnswerNum === currentQuestion.answer;

    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setCorrectAnswers((prev) => prev + 1);
      playCorrectSound();
    } else {
      playWrongSound();
    }

    // 2초 후 다음 문제 또는 결과 화면으로
    setTimeout(() => {
      setShowFeedback(false);
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setUserAnswer("");
        // 다음 문제에서 타이머와 음성 인식 자동 시작
        startTimer();
        if (speechSupported && !showTextInput && micPermissionGranted) {
          setTimeout(() => startListening(), 100);
        }
      } else {
        setGameState("result");
      }
    }, 1000);
  };

  // 답안 제출 wrapper (userAnswer 상태 사용)
  const submitAnswer = () => {
    submitAnswerWithValue();
  };

  // submitAnswerWithValue를 ref에 저장하여 음성 인식 콜백에서 최신 함수 참조 가능
  // useEffect의 dependency array가 빈 배열이면 초기 함수만 캡처되는 closure 문제 발생
  // 의존성 배열에 관련 state를 모두 포함하여 항상 최신 함수가 ref에 저장되도록 함
  useEffect(() => {
    submitAnswerRef.current = (answer: string) => {
      submitAnswerWithValue(answer);
    };
  }, [questions, currentQuestionIndex, showFeedback, userAnswer, correctAnswers]);

  // 키보드 입력 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      submitAnswer();
    }
  };

  // 다시 시작
  const resetGame = () => {
    // 타이머 정리
    stopTimer();

    setGameState("setup");
    setQuestionCount("10");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setUserAnswer("");
    setCorrectAnswers(0);
    setShowFeedback(false);
    setErrorMessage("");
    setShowTextInput(false);
    setTimeLeft(5);
    setTimerActive(false);
    // micPermissionGranted는 유지 - 사용자가 이미 허용한 권한은 계속 유지
    setIsListening(false);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const result: QuizResult = {
    correct: correctAnswers,
    total: questions.length,
    percentage: Math.round((correctAnswers / questions.length) * 100),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl">
        {/* 설정 화면 */}
        {gameState === "setup" && (
          <Card className="shadow-none">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-gray-800">🔢 퀴즈 설정</h2>
            {/* 문제 수 설정 */}
            <div className="mb-8">
              <label className="block text-xl sm:text-2xl font-semibold mb-4 text-gray-700">📝 몇 문제를 풀까요?</label>
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    const currentCount = parseInt(questionCount) || 10;
                    const newCount = Math.max(1, currentCount - 1);
                    setQuestionCount(newCount.toString());
                  }}
                  className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-3xl sm:text-4xl flex items-center justify-center shadow-lg"
                  aria-label="문제 수 감소"
                >
                  −
                </button>
                <Input
                  type="number"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  min="1"
                  max="100"
                  className="flex-1 text-center text-2xl sm:text-3xl font-bold py-4 h-auto"
                  placeholder="10"
                />
                <button
                  onClick={() => {
                    const currentCount = parseInt(questionCount) || 10;
                    const newCount = Math.min(100, currentCount + 1);
                    setQuestionCount(newCount.toString());
                  }}
                  className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold text-3xl sm:text-4xl flex items-center justify-center shadow-lg"
                  aria-label="문제 수 증가"
                >
                  +
                </button>
              </div>
            </div>
            {/* 제한시간 설정 */}
            <div className="mb-8">
              <label className="block text-xl sm:text-2xl font-semibold mb-4 text-gray-700">
                ⏱️ 정답 입력 제한시간
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { value: 1, label: "1초" },
                  { value: 2, label: "2초" },
                  { value: 3, label: "3초" },
                  { value: 4, label: "4초" },
                  { value: 5, label: "5초" },
                  { value: 0, label: "무제한" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeLimit(option.value)}
                    className={`py-4 sm:py-5 px-4 rounded-xl text-lg sm:text-xl font-bold ${
                      timeLimit === option.value
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={startQuiz}
              className="w-full text-2xl sm:text-3xl font-bold py-6 sm:py-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-600 hover:to-purple-600 shadow-xl"
            >
              🚀 퀴즈 시작하기
            </Button>
            {!speechSupported && (
              <p className="mt-6 text-base sm:text-lg text-orange-600 text-center font-medium">
                ⚠️ 음성 인식이 지원되지 않습니다. 키보드로 답을 입력해주세요.
              </p>
            )}
            {speechSupported && !micPermissionGranted && (
              <p className="mt-6 text-base sm:text-lg text-blue-600 text-center font-medium">
                🎤 음성 인식으로 답을 말해보세요! (마이크 권한이 필요합니다)
              </p>
            )}
            {speechSupported && micPermissionGranted && (
              <p className="mt-6 text-base sm:text-lg text-green-600 text-center font-medium">
                ✅ 음성 인식 준비 완료! 바로 시작할 수 있습니다.
              </p>
            )}
          </Card>
        )}

        {/* 마이크 권한 요청 화면 */}
        {gameState === "permission" && (
          <Card className="p-8 sm:p-12 text-center shadow-none">
            <div className="mb-8">
              <div className="text-8xl sm:text-9xl mb-6">🎤</div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-800">마이크 권한 필요</h2>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                음성으로 답을 말하려면 마이크 접근 권한이 필요합니다.
                <br />
                브라우저에서 마이크 권한을 허용해주세요.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={requestMicrophonePermission}
                className="w-full text-2xl sm:text-3xl py-6 sm:py-8 font-bold bg-blue-600 hover:bg-blue-700 shadow-xl"
              >
                🎤 마이크 권한 허용하기
              </Button>

              <Button
                onClick={() => {
                  setShowTextInput(true);
                  setGameState("quiz");
                }}
                className="w-full text-xl sm:text-2xl py-5 sm:py-6 font-bold bg-gray-500 hover:bg-gray-600 shadow-lg"
              >
                ⌨️ 키보드로 입력하기
              </Button>
            </div>

            {errorMessage && <p className="mt-6 text-base sm:text-lg text-red-600 font-medium">⚠️ {errorMessage}</p>}
          </Card>
        )}

        {/* 퀴즈 화면 */}
        {gameState === "quiz" && currentQuestion && (
          <div className="space-y-4 sm:space-y-6">
            {/* 진행률 및 타이머 */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
              <div className="flex justify-between text-base sm:text-lg font-semibold text-gray-700 mb-3">
                <span>
                  문제 {currentQuestionIndex + 1} / {questions.length}
                </span>
                <span className="text-blue-600">정답: {correctAnswers}개</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 mb-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 sm:h-4 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>

              {/* 타이머 */}
              {timerActive && (
                <div className="flex items-center justify-center space-x-3 sm:space-x-4">
                  <span className="text-base sm:text-lg font-medium text-gray-600">⏱️ 남은 시간:</span>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-4xl sm:text-5xl font-bold ${
                        timeLeft <= 3
                          ? "text-red-500 animate-pulse"
                          : timeLeft <= 5
                          ? "text-orange-500"
                          : "text-green-500"
                      }`}
                    >
                      {timeLeft}
                    </span>
                    <span className="text-lg sm:text-xl text-gray-600">초</span>
                  </div>
                </div>
              )}
              {!timerActive && timeLimit === 0 && (
                <div className="text-center text-gray-500 font-medium">⏱️ 제한시간 없음</div>
              )}
            </div>

            {/* 문제 */}
            <Card className="p-6 sm:p-10 text-center shadow-none">
              <div className="text-7xl sm:text-8xl md:text-9xl font-bold text-gray-800 mb-8 sm:mb-12">
                {currentQuestion.a} × {currentQuestion.b} = ?
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* 답변 표시 영역 */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-4 border-dashed border-gray-300 rounded-2xl p-6 sm:p-8 min-h-[100px] sm:min-h-[120px] flex flex-col items-center justify-center">
                  {userAnswer ? (
                    <div className="text-center">
                      <span className="text-5xl sm:text-6xl md:text-7xl font-bold text-blue-600">{userAnswer}</span>
                      {!isNaN(parseInt(userAnswer)) && parseInt(userAnswer) >= 0 && parseInt(userAnswer) <= 81 && (
                        <div className="text-lg sm:text-xl text-green-600 mt-3 font-semibold">✅ 유효한 답안</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-xl sm:text-2xl text-gray-400 text-center px-4">
                      {isListening ? "🎤 숫자를 말해주세요..." : "답을 기다리는 중..."}
                    </span>
                  )}
                </div>

                {errorMessage && (
                  <p className="text-base sm:text-lg text-red-600 font-medium text-center">⚠️ {errorMessage}</p>
                )}

                {/* 주요 버튼들 */}
                <div className="flex flex-col gap-3 sm:gap-4">
                  {speechSupported && micPermissionGranted && !showTextInput && (
                    <div className="space-y-3">
                      <Button
                        onClick={startListening}
                        disabled={isListening}
                        className={`text-2xl sm:text-3xl py-6 sm:py-8 w-full font-bold shadow-lg ${
                          isListening ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {isListening ? "🎤 듣는 중... (클릭해서 중단)" : "🎤 음성으로 답하기"}
                      </Button>
                      {!isListening && (
                        <p className="text-sm sm:text-base text-gray-500 text-center">
                          한국어 숫자(일, 이, 삼...) 또는 아라비아 숫자로 말해주세요
                          <br />
                          예시: "십이", "열둘", "12", "스물넷", "24"
                        </p>
                      )}
                      {isListening && (
                        <p className="text-base sm:text-lg text-blue-600 text-center animate-pulse font-semibold">
                          🎤 듣고 있습니다... 숫자를 말해주세요
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    onClick={submitAnswer}
                    disabled={!userAnswer.trim() || isListening}
                    className="text-2xl sm:text-3xl py-6 sm:py-8 font-bold shadow-lg"
                  >
                    ✅ 답안 제출
                  </Button>
                </div>

                {/* 텍스트 입력 옵션 */}
                {showTextInput ? (
                  <div className="pt-4 border-t border-gray-200">
                    <Input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="text-center text-2xl"
                      placeholder="키보드로 답을 입력하세요"
                      disabled={isListening}
                    />
                  </div>
                ) : (
                  speechSupported &&
                  micPermissionGranted && (
                    <button
                      onClick={() => setShowTextInput(true)}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      키보드로 입력하기
                    </button>
                  )
                )}
              </div>
            </Card>
          </div>
        )}

        {/* 결과 화면 */}
        {gameState === "result" && (
          <Card className="p-8 sm:p-12 text-center shadow-none">
            <h2 className="text-4xl sm:text-5xl font-bold mb-8 sm:mb-12 text-gray-800">퀴즈 완료! 🎉</h2>

            <div className="space-y-6 sm:space-y-8 mb-10 sm:mb-12">
              <div className="text-8xl sm:text-9xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {result.percentage}%
              </div>

              <div className="text-2xl sm:text-3xl text-gray-700 font-semibold">
                {result.total}문제 중 <span className="text-blue-600">{result.correct}문제</span> 정답
              </div>

              <div className="text-3xl sm:text-4xl font-bold">
                {result.percentage >= 90
                  ? "🏆 완벽해요!"
                  : result.percentage >= 80
                  ? "🎯 잘했어요!"
                  : result.percentage >= 70
                  ? "👍 좋아요!"
                  : result.percentage >= 60
                  ? "📚 조금 더 연습해봐요!"
                  : "💪 다시 도전해봐요!"}
              </div>
            </div>

            <Button
              onClick={resetGame}
              className="w-full text-2xl sm:text-3xl py-6 sm:py-8 font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-600 hover:to-purple-600 shadow-xl"
            >
              🔄 다시 하기
            </Button>
          </Card>
        )}

        {/* 정답/오답 오버레이 */}
        {showFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div
              className={`bg-white rounded-2xl p-8 sm:p-12 text-center shadow-2xl ${
                isCorrect ? "border-8 border-green-500" : "border-8 border-red-500"
              }`}
            >
              <div className={`text-8xl sm:text-9xl mb-6 ${isCorrect ? "text-green-500" : "text-red-500"}`}>
                {isCorrect ? "🎉" : "❌"}
              </div>
              <div className={`text-4xl sm:text-5xl font-bold mb-4 ${isCorrect ? "text-green-500" : "text-red-500"}`}>
                {isCorrect ? "정답!" : "틀렸어요!"}
              </div>
              {!isCorrect && (
                <div className="text-8xl sm:text-8xl text-gray-700 font-semibold">정답: {currentQuestion.answer}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
