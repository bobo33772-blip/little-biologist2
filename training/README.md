# 아동 그림 학습 데이터

곤충 ID별 폴더에 실제 아동 그림을 넣습니다.

```text
training/sketches/2/child-001.png
training/sketches/2/child-002.png
training/sketches/66/child-001.png
```

곤충별로 최소 30장 이상을 모은 뒤 다음 명령을 실행하면 CLIP 이미지 임베딩 기반
79종 스케치 분류기(`training/sketch-model.json`)가 생성됩니다.

```bash
npm run train:sketches
```

생성된 분류기는 기존 도감 이미지·프롬프트 점수와 함께 자동으로 사용됩니다.
