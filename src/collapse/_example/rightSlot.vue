<template>
  <div class="tdesign-collapse">
    <t-collapse>
      <t-collapse-panel value="0" header="这是一个折叠标题可以设置右侧操作区域" :disabled="disable0">
        <template #headerRightContent>
          <t-checkbox v-model="disable0">禁用</t-checkbox>
          <t-button size="small">操作</t-button>
        </template>
        这部分是每个折叠面板折叠或展开的内容，可根据不同业务或用户的使用诉求，进行自定义填充。可以是纯文本、图文、子列表等内容形式。
      </t-collapse-panel>
      <t-collapse-panel value="1" header="这是一个折叠标题可以设置右侧操作区域" :disabled="disable1">
        <template #headerRightContent>
          <t-checkbox v-model="disable1">禁用</t-checkbox>
          <t-button size="small">操作</t-button>
        </template>
        这部分是每个折叠面板折叠或展开的内容，可根据不同业务或用户的使用诉求，进行自定义填充。可以是纯文本、图文、子列表等内容形式。
      </t-collapse-panel>
      <t-collapse-panel value="2" header="这是一个折叠标题可以设置右侧操作区域" :disabled="disable2">
        <template #headerRightContent>
          <t-checkbox v-model="disable2">禁用</t-checkbox>
          <t-button size="small">操作</t-button>
        </template>
        这部分是每个折叠面板折叠或展开的内容，可根据不同业务或用户的使用诉求，进行自定义填充。可以是纯文本、图文、子列表等内容形式。
      </t-collapse-panel>
      <t-collapse-panel value="3" header="这是一个折叠标题可以设置右侧操作区域" :disabled="disable3">
        <template #headerRightContent>
          <t-checkbox v-model="disable3">禁用</t-checkbox>
          <t-button size="small">操作</t-button>
        </template>
        这部分是每个折叠面板折叠或展开的内容，可根据不同业务或用户的使用诉求，进行自定义填充。可以是纯文本、图文、子列表等内容形式。
      </t-collapse-panel>
    </t-collapse>
  </div>
</template>
<script>
export default {
  data() {
    return {
      disable0: false,
      disable1: true,
      disable2: false,
      disable3: true,
    };
  },
};
</script>
