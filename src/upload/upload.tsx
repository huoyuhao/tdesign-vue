/* eslint-disable no-param-reassign */
import Vue, { VNode } from 'vue';
import { ScopedSlotReturnValue } from 'vue/types/vnode';
import { prefix } from '../config';
import Dragger from './dragger';
import ImageCard from './image';
import FlowList from './flow-list';
import xhr from './xhr';
import { UploadFile } from './type';
import TIconUpload from '../icon/upload';
import TButton from '../button';
import TDialog from '../dialog';
import SingleFile from './single-file';
import { renderContent } from '../utils/render-tnode';
import props from './props';
import findIndex from 'lodash/findIndex';
import {
  HTMLInputEvent,
  SuccessContext,
  ProgressContext,
  UploadRemoveOptions,
  FlowRemoveContext,
} from './interface';
import { ClassName } from '../common';

const name = `${prefix}-upload`;

export default Vue.extend({
  name,

  components: {
    Dragger,
    SingleFile,
    ImageCard,
    FlowList,
    TDialog,
  },

  model: {
    prop: 'files',
    event: 'change',
  },

  props: { ...props },

  data() {
    return {
      dragActive: false,
      // 加载中的文件
      loadingFile: null as UploadFile,
      // 等待上传的文件队列
      toUploadFiles: [],
      errorMsg: '',
      showImageViewDialog: false,
      showImageViewUrl: '',
      // webkitURL is for chrome/webkot, while URL is for mozilla/firefox
      URL: window.webkitURL || window.URL,
    };
  },

  computed: {
    // 默认文件上传风格：文件进行上传和上传成功后不显示 tips
    showTips(): boolean {
      if (this.theme === 'file') {
        const noFile = (!this.files || !this.files.length) && (!this.loadingFile);
        return this.tips && noFile;
      }
      return Boolean(this.tips);
    },
    // 完全自定义上传
    showCustomDisplay(): boolean {
      return this.theme === 'custom';
    },
    // 单文件非拖拽类文件上传
    showSingleDisplay(): boolean {
      return (!this.draggable) && ['file', 'file-input'].includes(this.theme);
    },
    // 单文件非拖拽勒图片上传
    showImgCard(): boolean {
      return !this.draggable && this.theme === 'image';
    },
    // 拖拽类单文件或图片上传
    singleDraggable(): boolean {
      return !this.multiple && this.draggable && ['file', 'file-input', 'image'].includes(this.theme);
    },
    showUploadList(): boolean {
      return this.multiple && ['file-flow', 'image-flow'].includes(this.theme);
    },
    showImgDialog(): boolean {
      return ['image', 'image-flow', 'custom'].includes(this.theme);
    },
    showErrorMsg(): boolean {
      return !this.showUploadList && !!this.errorMsg;
    },
    tipsClasses(): ClassName {
      return ['t-upload__tips t-upload__small'];
    },
    errorClasses(): ClassName {
      return this.tipsClasses.concat('t-upload__tips-error');
    },
  },

  methods: {
    // handle event of preview img dialog event
    handlePreviewImg(event: MouseEvent, file: UploadFile) {
      if (!file.url) throw new Error('Error file');
      this.showImageViewUrl = file.url;
      this.showImageViewDialog = true;
      this.$emit('preview', { file, e: event });
    },

    handleChange(event: HTMLInputEvent): void {
      const { files } = event.target;
      if (this.disabled) return;
      this.uploadFiles(files);
      (this.$refs.input as HTMLInputElement).value = '';
    },

    handleDragChange(files: FileList): void {
      if (this.disabled) return;
      this.uploadFiles(files);
    },

    handleSingleRemove(e: MouseEvent) {
      const changeCtx =  { trigger: 'remove' };
      this.$emit('change', [], changeCtx);
      this.onChange && this.onChange([], changeCtx);
      this.$emit('remove', { e });
      this.onRemove && this.onRemove({ e });
    },

    handleMultipleRemove(options: UploadRemoveOptions) {
      const changeCtx =  { trigger: 'remove', ...options };
      const files = this.files.concat();
      files.splice(options.index, 1);
      this.$emit('change', files, changeCtx);
      this.onChange && this.onChange(files, changeCtx);
      this.$emit('remove', options);
      this.onRemove && this.onRemove(options);
    },

    handleListRemove(context: FlowRemoveContext) {
      const { file } = context;
      const index = findIndex(this.toUploadFiles, o => o.name === file.name);
      if (index >= 0) {
        this.toUploadFiles.splice(index, 1);
      } else {
        const index = findIndex(this.files, o => o.name === file.name);
        this.handleMultipleRemove({ e: context.e, index });
      }
    },

    uploadFiles(files: FileList) {
      let tmpFiles = [...files];
      if (this.max) {
        tmpFiles = tmpFiles.slice(0, this.max - this.files.length);
        if (tmpFiles.length !== files.length) {
          console.warn(`TDesign Upload Warn: you can only upload ${this.max} files`);
        }
      }
      tmpFiles.forEach((fileRaw: File) => {
        let file: UploadFile | File = fileRaw;
        if (typeof this.format === 'function') {
          file = this.format(fileRaw);
        }
        const uploadFile: UploadFile = {
          raw: fileRaw,
          lastModified: fileRaw.lastModified,
          name: fileRaw.name,
          size: fileRaw.size,
          type: fileRaw.type,
          percent: 0,
          status: 'waiting',
          ...file,
        };
        uploadFile.url = this.getLocalFileURL(fileRaw);
        this.handleBeforeUpload(file).then((canUpload) => {
          if (!canUpload) return;
          const newFiles = this.toUploadFiles.concat();
          newFiles.push(uploadFile);
          this.toUploadFiles = [...new Set(newFiles)];
          this.loadingFile = uploadFile;
          if (this.autoUpload) {
            this.upload(uploadFile);
          }
        });
      });
    },

    async upload(file: UploadFile): Promise<void> {
      if (!this.action) {
        console.error('TDesign Upload Error: action is required.');
        return;
      }
      this.errorMsg = '';
      file.status = 'progress';
      this.loadingFile = file;
      const request = xhr;
      request({
        action: this.action,
        data: this.data,
        file,
        name: this.name,
        headers: this.headers,
        withCredentials: this.withCredentials,
        onError: this.onError,
        onProgress: this.handleProgress,
        onSuccess: this.handleSuccess,
      });
    },

    multipleUpload(files: Array<UploadFile>) {
      files.forEach((file) => {
        this.upload(file);
      });
    },

    onError(options: { event: ProgressEvent; file: UploadFile; response?: any }) {
      const { event, file, response } = options;
      file.status = 'fail';
      this.loadingFile = file;
      let res = response;
      if (typeof this.formatResponse === 'function') {
        res = this.formatResponse(response);
      }
      this.errorMsg = (res && res.error) ?? '上传失败';
      const context = { e: event, file };
      this.$emit('fail', context);
      this.onFail && this.onFail(context);
    },

    handleProgress({ event, file, percent }: ProgressContext) {
      file.percent = percent;
      this.loadingFile = file;
      const progressCtx = { percent, e: event, file };
      this.$emit('progress', progressCtx);
      this.onProgress && this.onProgress(progressCtx);
    },

    handleSuccess({ event, file, response }: SuccessContext) {
      file.status = 'success';
      file.url = response.url || file.url;
      // 从待上传文件队列中移除上传成功的文件
      const index = findIndex(this.toUploadFiles, o => o.name === file.name);
      this.toUploadFiles.splice(index, 1);
      // 上传成功的文件发送到 files
      const newFile: UploadFile = { ...file, response };
      const files = this.multiple ? this.files.concat(newFile) : [newFile];
      const context = { e: event, response, trigger: 'upload-success' };
      this.$emit('change', files, context);
      this.onChange && this.onChange(files, context);
      const sContext = { file, fileList: files, e: event, response };
      this.$emit('success', sContext);
      this.onSuccess && this.onSuccess(sContext);
      // https://developer.mozilla.org/zh-CN/docs/Web/API/URL/createObjectURL
      this.URL && this.URL.revokeObjectURL(this.loadingFile.url);
      this.loadingFile = null;
    },

    handlePreview({ file, event }: {file: UploadFile; event: ProgressEvent}) {
      return { file, event };
    },

    triggerUpload() {
      if (this.disabled) return;
      (this.$refs.input as HTMLInputElement).click();
    },

    handleDragenter(e: DragEvent) {
      if (this.disabled) return;
      this.$emit('dragenter', { e });
      this.dragActive = true;
      this.onDragenter && this.onDragenter({ e });
    },

    handleDragleave(e: DragEvent) {
      if (this.disabled) return;
      this.$emit('dragleave', { e });
      this.dragActive = false;
      this.onDragleave && this.onDragleave({ e });
    },

    handleBeforeUpload(file: File | UploadFile): Promise<boolean> {
      if (typeof this.beforeUpload === 'function') {
        const r = this.beforeUpload(file);
        if (r instanceof Promise) return r;
        return new Promise(resolve => resolve(r));
      }
      return new Promise(resolve => resolve(true));
    },

    cancelUpload() {
      if (!this.files[0] && this.loadingFile) {
        // https://developer.mozilla.org/zh-CN/docs/Web/API/URL/createObjectURL
        this.URL && this.URL.revokeObjectURL(this.loadingFile.url);
        this.loadingFile = null;
      }
      (this.$refs.input as HTMLInputElement).value = '';
    },

    // close image view dialog
    cancelPreviewImgDialog() {
      this.showImageViewDialog = false;
      this.showImageViewUrl = '';
    },

    getDefaultTrigger() {
      if (this.theme === 'file-input' || this.showUploadList) {
        return <TButton variant='outline'>选择文件</TButton>;
      }
      return (
        <TButton variant='outline'>
          <TIconUpload slot='icon'/>点击上传
        </TButton>
      );
    },

    getLocalFileURL(file: File) {
      return this.URL && this.URL.createObjectURL(file);
    },

    renderInput() {
      return (
        <input
          ref='input'
          type='file'
          disabled={this.disabled}
          onChange={this.handleChange}
          multiple={this.multiple}
          accept={this.accept}
          hidden
        />
      );
    },
    // 渲染单文件预览：设计稿有两种单文件预览方式，文本型和输入框型
    renderSingleDisplay(triggerElement: ScopedSlotReturnValue) {
      return (
        <SingleFile
          file={this.files && this.files[0]}
          loadingFile={this.loadingFile}
          display={this.theme}
          remove={this.handleSingleRemove}
          placeholder={this.placeholder}
        >
          <div class='t-upload__trigger' onclick={this.triggerUpload}>{triggerElement}</div>
        </SingleFile>
      );
    },
    renderDraggerTrigger() {
      const params = {
        dragActive: this.dragActive,
        uploadingFile: this.multiple ? this.toUploadFiles : this.loadingFile,
      };
      const triggerElement = renderContent(this, 'default', 'trigger', { params });
      return (
        <Dragger
          onChange={this.handleDragChange}
          onDragenter={this.handleDragenter}
          onDragleave={this.handleDragleave}
          loadingFile={this.loadingFile}
          file={this.files && this.files[0]}
          display={this.theme}
          cancel={this.cancelUpload}
          trigger={this.triggerUpload}
          remove={this.handleSingleRemove}
          upload={this.upload}
        >
          {triggerElement}
        </Dragger>
      );
    },
    renderTrigger() {
      const defaultNode = this.getDefaultTrigger();
      return renderContent(this, 'default', 'trigger', defaultNode);
    },
    renderCustom(triggerElement: VNode) {
      return this.draggable
        ? this.renderDraggerTrigger()
        : <div class='t-upload__trigger' onclick={this.triggerUpload}>{triggerElement}</div>;
    },
  },

  render(): VNode {
    const triggerElement = this.renderTrigger();
    return (
      <div class='t-upload'>
        {this.renderInput()}
        {this.showCustomDisplay && this.renderCustom(triggerElement)}
        {this.showSingleDisplay && this.renderSingleDisplay(triggerElement)}
        {this.singleDraggable && this.renderDraggerTrigger()}
        {this.showImgCard && (
          <ImageCard
            files={this.files}
            multiple={this.multiple}
            remove={this.handleMultipleRemove}
            trigger={this.triggerUpload}
            loadingFile={this.loadingFile}
            toUploadFiles={this.toUploadFiles}
            max={this.max}
            onImgPreview={this.handlePreviewImg}
          ></ImageCard>
        )}
        {this.showUploadList && (
          <FlowList
            files={this.files}
            placeholder={this.placeholder}
            autoUpload={this.autoUpload}
            toUploadFiles={this.toUploadFiles}
            remove={this.handleListRemove}
            upload={this.multipleUpload}
            cancel={this.cancelUpload}
            display={this.theme}
            onImgPreview={this.handlePreviewImg}
            onChange={this.handleDragChange}
            onDragenter={this.handleDragenter}
            onDragleave={this.handleDragleave}
          >
            <div class='t-upload__trigger' onclick={this.triggerUpload}>{triggerElement}</div>
          </FlowList>
        )}
        {this.showImgDialog && (
          <TDialog
            visible={this.showImageViewDialog}
            showOverlay
            width='auto'
            top='10%'
            class='t-upload-dialog'
            footer={false}
            header={false}
            onClose={this.cancelPreviewImgDialog}>
              <p class='t-dialog__body-img-box'>
                <img class='' src={this.showImageViewUrl} alt='' />
              </p>
          </TDialog>
        )}
        {!this.errorMsg && this.showTips && <small class={this.tipsClasses}>{this.tips}</small>}
        {this.showErrorMsg && <small class={this.errorClasses}>{this.errorMsg}</small>}
      </div>
    );
  },
});
