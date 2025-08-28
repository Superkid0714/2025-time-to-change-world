# ⏰ 사섬 청년들의 시간관리 진단 프로젝트

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/7fea5497-5f97-4904-afc4-393f0668163e" />

해당 프로젝트는 사섬 청년들의 시간 관리 습관을 진단하고, 그 결과를 시각적으로 분석하여 보여주는 웹 애플리케이션입니다 
사용자는 간단한 체크리스트를 통해 자신의 시간 관리 유형을 파악하고, 관리자는 수집된 데이터를 기반으로 전반적인 시간 관리 현황을 이해할 수 있습니다

## ✨ 주요 기능

### 1. 사용자 시간 관리 진단

- **체크리스트**: 10가지 질문에 대한 답변을 통해 사용자의 시간 관리 습관을 진단합니다
- **맞춤형 결과**: 체크된 항목 수에 따라 '리더핑', '계획핑', '작심삼일핑', '노답핑' 중 하나의 유형을 부여하고, 각 유형에 맞는 설명과 메시지를 제공합니다
- **데이터 저장**: 진단 결과는 Firebase Firestore에 안전하게 저장됩니다

<img width="1133" height="632" alt="image" src="https://github.com/user-attachments/assets/0099daf6-48a0-430b-ba42-2a6d710b9a7c" />

<img width="1135" height="617" alt="image" src="https://github.com/user-attachments/assets/c64ba9a3-8fce-4be4-ba67-224599b43939" />


### 2. 관리자 대시보드

- **종합 통계**: 총 응답 수, 평균 체크 수, 오늘 응답 수, 가장 많이 나온 유형(최다 핑) 등 핵심 지표를 한눈에 볼 수 있습니다
- **핑별 분포**: 파이 차트를 통해 각 시간 관리 유형의 분포를 시각적으로 보여주며, 특정 날짜별로 필터링하여 볼 수 있습니다
- **시간별 응답 추이**: 일별, 주별, 월별 응답 수 변화를 막대 차트로 제공하여 시간 경과에 따른 트렌드를 파악할 수 있습니다
- **인기 항목 분석**: 사용자들이 가장 많이 체크한 항목들을 순위별로 보여주어 어떤 습관이 가장 흔한 문제인지 파악할 수 있습니다. 이 또한 날짜별 필터링이 가능합니다
- **데이터 새로고침**: 최신 데이터를 Firebase에서 즉시 불러와 반영할 수 있습니다

<img width="2746" height="1348" alt="image" src="https://github.com/user-attachments/assets/6511c1d4-e724-45b2-92fb-4b1139bb6d10" />
<img width="2746" height="1348" alt="image" src="https://github.com/user-attachments/assets/f1a06b7d-d8c2-44e3-8b65-ba0a724e80a9" />
<img width="2674" height="818" alt="image" src="https://github.com/user-attachments/assets/cf01060d-653e-482b-ab47-fa5223d7cfcb" />


## 🛠️ 기술 스택

- **프론트엔드**:
  - **React**: 사용자 인터페이스 구축을 위한 JavaScript 라이브러리
  - **Vite**: 빠르고 효율적인 개발 환경 및 번들링 도구
  - **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크로, 빠르고 유연한 스타일링을 가능하게 합니다
  - **Recharts**: 반응형 차트를 쉽게 구현할 수 있는 React 기반 차트 라이브러리
  - **Lucide React**: 다양한 아이콘을 제공하여 UI를 풍부하게 합니다
- **백엔드/데이터베이스**:
  - **Firebase (Firestore)**: 실시간 데이터베이스 및 백엔드 서비스로, 사용자 진단 결과 저장 및 관리에 사용됩니다
- **라우팅**:
  - **React Router DOM**: 애플리케이션 내 페이지 전환 및 관리자 모드 접근을 위해 사용됩니다


## 😀 배포 및 사용

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/d57cd030-2860-4abb-bfd4-310b75888ba2" />
<img width="2691" height="1724" alt="image" src="https://github.com/user-attachments/assets/c0d49f5f-7e36-41df-b920-c5a3d1f017e2" />

## 🚀 시작하기

프로젝트를 로컬 환경에서 실행하려면 다음 단계를 따르세요

1.  **저장소 클론**:
    ```bash
    git clone https://github.com/Superkid0714/2025-time-to-change-world.git
    cd 2025-time-to-change-world
    ```
2.  **의존성 설치**:
    ```bash
    npm install
    ```
3.  **Firebase 설정**:
    - Firebase 프로젝트를 생성하고 Firestore를 활성화합니다
    - 프로젝트 설정에서 웹 앱을 추가하고 Firebase SDK 구성을 가져옵니다
    - `src/firebase.js` 파일을 열고 가져온 Firebase 구성으로 업데이트합니다
4.  **개발 서버 실행**:
    ```bash
    npm run dev
    ```
    애플리케이션이 실행됩니다
