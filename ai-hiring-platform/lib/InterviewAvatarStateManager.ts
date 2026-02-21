"use client";

import { create } from "zustand";

/**
 * AvatarState
 */
export enum AvatarState {
    IDLE = "IDLE",
    SPEAKING = "SPEAKING",
    THINKING = "THINKING"
}

interface AvatarStateStore {
    state: AvatarState;
    setState: (state: AvatarState) => void;
}

/**
 * useAvatarStore
 * Global state for the avatar to ensure persistence and easy access across components.
 */
export const useAvatarStore = create<AvatarStateStore>((set) => ({
    state: AvatarState.IDLE,
    setState: (state: AvatarState) => set({ state }),
}));

/**
 * InterviewAvatarStateManager
 * Helper class to transition states based on app logic.
 */
class InterviewAvatarStateManager {
    setIDLE() {
        useAvatarStore.getState().setState(AvatarState.IDLE);
    }

    setSPEAKING() {
        useAvatarStore.getState().setState(AvatarState.SPEAKING);
    }

    setTHINKING() {
        useAvatarStore.getState().setState(AvatarState.THINKING);
    }
}

export const avatarStateManager = new InterviewAvatarStateManager();
