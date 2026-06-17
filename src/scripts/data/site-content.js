(function (window) {
    "use strict";

    var namespace = window.SakuraHomepage || (window.SakuraHomepage = {});

    namespace.siteData = {
        profile: {
            avatarSrc: "public/images/avatar.jpg",
            title: "Klauthmos",
            subtitle: "NianBroken",
            description: "人生而自由 却无往不在枷锁之中"
        },
        primaryLinks: [
            {
                label: "首页",
                type: "link",
                href: "./",
                target: "_self"
            },
            {
                label: "博客",
                type: "modal",
                modalKey: "blogWechat"
            },
            {
                label: "简历",
                type: "link",
                href: "https://r.dmego.cn",
                target: "_blank"
            },
            {
                label: "关于",
                type: "link",
                href: "https://dmego.cn/about/",
                target: "_blank"
            }
        ],
        socialLinks: [
            {
                label: "GitHub",
                iconClass: "icon-github",
                href: "https://github.com/dmego/"
            },
            {
                label: "Cnblogs",
                iconClass: "icon-cnblogs",
                href: "http://www.cnblogs.com/dmego/"
            },
            {
                label: "Zhihu",
                iconClass: "icon-zhihu",
                href: "https://www.zhihu.com/people/dmego/"
            },
            {
                label: "Email",
                iconClass: "icon-email",
                href: "mailto:dmeago@gmail.com"
            }
        ],
        modals: {
            blogWechat: {
                imageSrc: "public/images/wechat.jpg",
                imageAlt: "博客弹窗内容"
            }
        }
    };
})(window);
