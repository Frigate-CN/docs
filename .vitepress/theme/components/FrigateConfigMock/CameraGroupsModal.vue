<script setup>
import { computed } from "vue";
import LcIcon from "./LcIcon.vue";
import FieldHint from "./FieldHint.vue";

/**
 * Mock of the camera-group flow that lives on the LIVE page (not settings):
 * the pencil button in the main left icon rail opens a centered Dialog
 * (CameraGroupSelector.tsx → NewGroupDialog → CameraGroupEdit) with
 *   名称 input
 *   摄像头 switch list (per camera + birdseye)
 *   图标 picker button
 *   取消 / 保存 footer
 *
 * Data driven: cameras come from step.values.cameras, the edited group name
 * from step.values.name — docs pages pass their own values per step.
 */
const props = defineProps({
    step: { type: Object, required: true },
    navigation: { type: Object, required: true },
    focusRef: { type: Object, default: null },
});

const cameras = computed(() => {
    const raw = props.step.values?.cameras;
    if (Array.isArray(raw)) {
        return raw.map((item) =>
            typeof item === "string" ? { name: item, enabled: false } : item,
        );
    }
    return [
        { name: "front_door", enabled: true },
        { name: "driveway", enabled: false },
        { name: "back_yard", enabled: false },
    ];
});

const groupName = computed(() => props.step.values?.name ?? "");

const phase = computed(() => props.step.guidePhase);
const showRailTarget = computed(() => phase.value === "group-trigger");
const showEditField = computed(() => phase.value === "field");

const focused = computed(
    () => showEditField.value && props.step.focus === "name",
);
</script>

<template>
    <!-- centered dialog (the live page icon rail is rendered by the shared
         IconRail in FocusedSettings so every mock looks alike) -->
    <div class="groupDialog" :class="{ groupDialogNarrow: !showEditField }">
        <template v-if="!showEditField">
            <!-- group list state -->
            <header class="groupDialogHeader">
                <h3>摄像头组</h3>
                <span class="groupDialogAdd">
                    <LcIcon name="plus" :size="14" />
                </span>
            </header>
            <div class="groupDialogList">
                <div class="groupDialogRow">
                    <span>{{ groupName || "default" }}</span>
                    <span class="groupDialogRowActions">
                        <LcIcon name="pencil" :size="15" />
                        <LcIcon name="trash-2" :size="15" />
                    </span>
                </div>
            </div>
            <FieldHint v-if="phase === 'group-list'" class="groupDialogHint"
                :navigation="navigation" :text="step.hint ?? step.guideLabel"
                title="摄像头组" />
        </template>

        <template v-else>
            <!-- edit form state (CameraGroupEdit) -->
            <header class="groupDialogHeader form">
                <h3>编辑摄像头组</h3>
            </header>

            <div class="groupDialogForm">
                <div class="groupFormField" :class="{ focused: focused }"
                    :ref="(el) => { if (focused && focusRef) focusRef.current = el }">
                    <span class="groupFormLabel">名称</span>
                    <span class="input">{{ groupName || "请输入名称…" }}</span>
                </div>

                <div class="groupFormSeparator" />

                <div class="groupFormField">
                    <span class="groupFormLabel">摄像头</span>
                    <p class="groupFormDesc">选择添加至该组的摄像头。</p>
                    <div class="groupCameraRows">
                        <div v-for="camera in cameras" :key="camera.name" class="groupCameraRow">
                            <span class="groupCameraName">{{ camera.name.replaceAll("_", " ") }}</span>
                            <span class="switch" :class="{ switchOn: camera.enabled }">
                                <span />
                            </span>
                        </div>
                    </div>
                </div>

                <div class="groupFormSeparator" />

                <div class="groupFormField">
                    <span class="groupFormLabel">图标</span>
                    <span class="input selectInput iconPickerButton">
                        <span class="iconPickerValue">
                            <LcIcon name="videocam-outline" :size="15" />
                            摄像机
                        </span>
                        <LcIcon name="chevron-down" :size="14" />
                    </span>
                </div>

                <div class="groupFormSeparator" />

                <div class="groupDialogFooter">
                    <span class="groupDialogButton">取消</span>
                    <span class="groupDialogButton primary">保存</span>
                </div>
            </div>

            <FieldHint v-if="focused" class="groupDialogHint" :navigation="navigation"
                :text="step.hint ?? step.guideLabel" title="名称" />
        </template>
    </div>
</template>
