(function (window) {
    "use strict";

    var namespace = window.SakuraHomepage || (window.SakuraHomepage = {});

    /*
     * 站点数据配置参考
     *
     * 本文件由页面启动时直接读取。保留 namespace.siteData 的对象结构和四个顶级字段，
     * 即使暂时清空全部业务数据，也可按照下方示例重新填写。
     *
     * profile 中四个字段都必须填写字符串。avatarSrc 是相对于 index.html 的图片路径，
     * title、subtitle 和 description 分别显示为姓名、副标题和简介。
     *
     * primaryLinks 中每一项只能使用以下两种结构：
     * {
     *     label: "按钮文字",
     *     type: "link",
     *     href: "https://example.com/",
     *     target: "_blank"
     * }
     * 普通链接必须填写 label、type、href。target 可省略，填写时仅使用 "_self" 或
     * "_blank"。使用 "_blank" 会在新标签页打开链接。
     *
     * {
     *     label: "打开图片",
     *     type: "modal",
     *     modalKey: "exampleModal"
     * }
     * 弹窗链接必须填写 label、type、modalKey。modalKey 必须与 modals 中的键名完全相同，
     * 不需要填写 href 或 target。
     *
     * socialLinks 中每一项必须填写 label、type、iconSrc。iconSrc 是相对于 index.html
     * 的本地图标路径。type 为 "link" 时还必须填写 href，链接始终在新标签页打开。
     * type 为 "modal" 时还必须填写 modalKey，modalKey 必须与 modals 中的键名完全相同。
     *
     * modals 的每个键名都可作为 primaryLinks 的 modalKey。每项必须填写 imageSrc 和
     * imageAlt。imageSrc 是相对于 index.html 的图片路径，imageAlt 是图片的文字说明。
     */
    namespace.siteData = {
        profile: {
            avatarSrc: "public/images/avatar.jpg",
            title: "Klauthmos",
            subtitle: "NianBroken",
            description: "人生而自由 却无往不在枷锁之中"
        },
        primaryLinks: [
            // 普通链接示例：取消注释后替换为实际内容。
            // {
            //     label: "个人主页",
            //     type: "link",
            //     href: "https://example.com/",
            //     target: "_blank"
            // },
            // 弹窗链接示例：modalKey 必须与下方 modals 的键名相同。
            // {
            //     label: "查看二维码",
            //     type: "modal",
            //     modalKey: "exampleModal"
            // }
        ],
        socialLinks: [
            {
                label: "QQ",
                type: "link",
                iconSrc: "public/icons/qq.svg",
                href: "https://qm.qq.com/cgi-bin/qm/qr?k=qC1PE50EbPizyX_9NHsNxQSWawteFoRD"
            },
            {
                label: "微信",
                type: "modal",
                iconSrc: "public/icons/wechat.svg",
                modalKey: "wechatQrCode"
            },
            {
                label: "邮箱",
                type: "link",
                iconSrc: "public/icons/mail.svg",
                href: "mailto:suinian666@gmail.com"
            },
            {
                label: "Telegram",
                type: "link",
                iconSrc: "public/icons/telegram.svg",
                href: "https://t.me/Nianbroken"
            },
            {
                label: "GitHub",
                type: "link",
                iconSrc: "public/icons/github.svg",
                href: "https://github.com/NianBroken"
            }
        ],
        modals: {
            wechatQrCode: {
                imageSrc: "public/images/wechat-qr-code.png",
                imageAlt: "微信二维码"
            }
        }
    };
})(window);
