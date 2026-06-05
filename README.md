# BX-T1 - Content Creation Video Factory

> 🚀 Hackathon Project by Team JEG  
> 🎯 Sponsor: BytePlus × TRAE  
> ⚡ Goal: Turn one brief into two publish-ready short-form video variants in under 60 minutes

## 👥 Team Information

**Team Name:** JEG

**Members:**

- Minh Tien
- Thuy Linh
- Anh Thu
- Hai Nam
- Tran Lam

## ✨ Overview

BX-T1 is an agentic content factory orchestrated by TRAE for short-form video production. From a single creative brief, the system generates two publish-ready content variants for TikTok, Reels, or Shorts in under 60 minutes, with a target of at least 80% editor-rated publishability.

## 😵 Problem

Creating a 60-second TikTok video can take creators between 8 and 20 hours. Designers, editors, and copywriters become bottlenecks whenever teams need to test multiple hooks or creative directions. General-purpose AI tools often fail to match brand identity or platform-specific conventions.

## 🎯 Target Users

- Solo creators
- In-house content teams with 5-20 members
- SME marketing managers in Southeast Asia
- Focus industries: e-commerce, F&B, and service businesses

## 🛠️ Mission

Build an end-to-end content production workflow powered by TRAE:

- Input brief
- Generate multiple hook variants
- Produce full scripts
- Create storyboard frames
- Define A-roll and B-roll plans
- Generate voiceover
- Burn in subtitles
- Produce cover art
- Generate titles and captions
- Export platform-ready video cuts

Each brief must produce at least two measurable creative directions for A/B testing.

## 📥 Inputs

- Creative brief: topic, brand tone, audience, platform, and hard constraints such as duration, claims, and compliance
- Brand kit: logo, color palette, fonts, and product imagery
- Optional moodboard or references

## 📤 Expected Outputs

- At least one publish-ready 15-30 second video for TikTok, Reels, or Shorts
- Two creative variants from one brief
- Export formats in 9:16 and at minimum 1:1
- A reusable TRAE workflow that judges can duplicate and run

## ✅ Mandatory Requirements

- Seedance 2.0 is required for video generation
- Support T2V, I2V, or R2V generation flow
- Seed 2.0 via ModelArk is optional for script, hook, caption, and title A/B generation
- TRAE orchestration must be clearly visible in the workflow
- End-to-end goal: brief to two variants in under 60 minutes

## 🧰 Suggested Tech Stack

- Seedance 2.0
- Seed 2.0 (ModelArk)
- TRAE
- ElevenLabs or another TTS engine for voiceover
- Whisper plus subtitle burn-in pipeline

## 🎬 Sample Use Cases

1. F&B brief to generate two 20-second variants:
   - Emotional storytelling
   - Product-led demo
   - Output for TikTok and Reels
2. Skincare brief to generate hook variants A/B/C and promote the winning version into a full video
3. Changing one input variable, such as audience from "Gen Z" to "Millennial mom", should produce a meaningful creative shift

## 🏆 Evaluation Criteria

- Clean pipeline from brief to content plan to production to final video
- Consistent style and tone across variants
- Fast revision loop
- At least 80% of editors rate the output as publishable
- Strong workflow reusability

## 💡 Core Value Proposition

- One brief in
- Two creative directions out
- Publish-ready short-form video production
- Faster experimentation with measurable A/B testing
- Better brand and platform alignment than generic AI tools

## 📦 Repository Goal

This repository is intended to host the BX-T1 workflow, assets, automation logic, and reusable orchestration templates for the hackathon submission sponsored by BytePlus and TRAE.
