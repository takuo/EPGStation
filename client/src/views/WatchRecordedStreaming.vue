<template>
    <v-main>
        <TitleBar title="視聴"></TitleBar>
        <transition name="page">
            <div class="video-container-wrap mx-auto">
                <VideoContainer v-if="videoParam !== null" ref="video" v-on:onCapture="onCapture" v-bind:videoParam="videoParam"></VideoContainer>
                <WatchOnRecordedInfoCard v-if="videoParam !== null" ref="card" v-bind:recordedId="videoParam.recordedId"></WatchOnRecordedInfoCard>
                <div style="visibility: hidden">dummy</div>
            </div>
        </transition>
    </v-main>
</template>

<script lang="ts">
import WatchOnRecordedInfoCard from '@/components/recorded/watch/WatchRecordedInfoCard.vue';
import TitleBar from '@/components/titleBar/TitleBar.vue';
import VideoContainer from '@/components/video/VideoContainer.vue';
import * as VideoParam from '@/components/video/VideoParam';
import container from '@/model/ModelContainer';
import IScrollPositionState from '@/model/state/IScrollPositionState';
import ISnackbarState, { SnackBarTextOption } from '@/model/state/snackbar/ISnackbarState';
import IServerConfigModel from '@/model/serverConfig/IServerConfigModel';
import { Component, Vue, Watch } from 'vue-property-decorator';
import CaptureUtil from '@/util/CaptureUtil';
import * as apid from '../../../api';

Component.registerHooks(['beforeRouteUpdate', 'beforeRouteLeave']);

@Component({
    components: {
        TitleBar,
        VideoContainer,
        WatchOnRecordedInfoCard,
    },
})
export default class WatchRecordedStreaming extends Vue {
    public videoParam: VideoParam.RecordedStreamingParam | VideoParam.RecordedHLSParam | null = null;
    private scrollState: IScrollPositionState = container.get<IScrollPositionState>('IScrollPositionState');
    private snackbarState: ISnackbarState = container.get<ISnackbarState>('ISnackbarState');
    private serverConfig: IServerConfigModel = container.get<IServerConfigModel>('IServerConfigModel');

    private imageUploader: apid.ImageUploaderInfo | null = null;

    constructor() {
        super();
        const config = this.serverConfig.getConfig();
        if (config === null) {
            console.log('config is null');
            return;
        }
        if (config?.imageUploader) {
            this.imageUploader = config.imageUploader;
        }
    }

    @Watch('$route', { immediate: true, deep: true })
    public onUrlChange(): void {
        // 視聴パラメータセット
        const videoFileId = parseInt(this.$route.params.id, 10);
        const recordedId = typeof this.$route.query.recordedId !== 'string' ? null : parseInt(this.$route.query.recordedId, 10);
        const streamingType = typeof this.$route.query.streamingType !== 'string' ? null : this.$route.query.streamingType;
        const mode = typeof this.$route.query.mode !== 'string' ? null : parseInt(this.$route.query.mode, 10);

        this.$nextTick(async () => {
            if (videoFileId !== null && recordedId !== null && streamingType !== null && mode !== null) {
                if (streamingType === 'hls') {
                    this.videoParam = {
                        type: 'RecordedHLS',
                        recordedId: recordedId,
                        videoFileId: videoFileId,
                        mode: mode,
                    };
                } else {
                    this.videoParam = {
                        type: 'RecordedStreaming',
                        recordedId: recordedId,
                        videoFileId: videoFileId,
                        streamingType: streamingType,
                        mode: mode,
                    };
                }
            }

            // データ取得完了を通知
            await this.scrollState.emitDoneGetData();
        });
    }

    /**
     * キャプチャダウンロード
     */
    public async onCapture(data: CaptureUtil.CaptureInfo): Promise<void> {
        if (data.dataUrl === '') {
            this.snackbarState.open({
                color: 'error',
                text: 'キャプチャに失敗しました。',
            });
            return;
        }
        if (typeof this.$refs.card !== 'undefined') {
            data.title = `${(this.$refs.card as WatchOnRecordedInfoCard).displayInfo?.name}`;
        }
        const result = (await CaptureUtil.onCapture(data, this.imageUploader)) as SnackBarTextOption;
        this.snackbarState.open(result);
    }
}
</script>

<style lang="sass" scoped>
.video-container-wrap
    max-width: 1200px
</style>
