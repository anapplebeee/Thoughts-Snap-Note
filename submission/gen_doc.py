# -*- coding: utf-8 -*-
"""生成《微信小程序作品说明文档》PDF（原生路线）。"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer,
                                ListFlowable, ListItem)

pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
FONT = 'STSong-Light'

styles = getSampleStyleSheet()
title = ParagraphStyle('title', parent=styles['Title'], fontName=FONT,
                       fontSize=18, leading=24, spaceAfter=8, alignment=TA_LEFT)
h2 = ParagraphStyle('h2', parent=styles['Heading2'], fontName=FONT,
                   fontSize=13, leading=18, spaceBefore=10, spaceAfter=4)
body = ParagraphStyle('body', parent=styles['BodyText'], fontName=FONT,
                      fontSize=10.5, leading=16, alignment=TA_LEFT, spaceAfter=4)
bullet = ParagraphStyle('bullet', parent=body, leftIndent=12, spaceAfter=2)

OUT = 'D:/code/Thoughts-Snap-Note/submission/小程序说明文档.pdf'

doc = SimpleDocTemplate(OUT, pagesize=A4,
                        leftMargin=20 * mm, rightMargin=20 * mm,
                        topMargin=18 * mm, bottomMargin=18 * mm,
                        title='微信小程序作品说明文档 - 想法随手记',
                        author='想法随手记团队')

story = []


def P(t, s=body):
    story.append(Paragraph(t, s))


def H(t):
    story.append(Paragraph(t, h2))


def B(items):
    story.append(ListFlowable(
        [ListItem(Paragraph(i, bullet), leftIndent=10) for i in items],
        bulletType='bullet', start='•'))


P('微信小程序作品说明文档', title)
P('作品名称：想法随手记（WeChat Thought Note）', body)

H('一、作品概述')
P('一款面向微信生态、为快节奏移动记录打造的 AI 智能随手记小程序。支持极速灵感闪记、多大模型热切换、'
  '微信聊天记录一键萃取，以及端到端加密隐私保险箱，让用户随时随地把碎片想法沉淀为结构化、可复盘的笔记。')

H('二、功能简介')
B([
    '极速灵感闪记：首页置顶常驻记录卡片 + 底部加号，打开即写；内置突发灵感 / 待办 / 读书 / 记账 / 密码等快捷胶囊。',
    '多大模型统一接入与任意切换：支持用户自主配置 DeepSeek / 智谱 GLM / 自定义 OpenAI 兼容接口 Key，无需依赖服务端密钥。',
    '微信聊天记录一键萃取：粘贴聊天记录，大模型自动剔除寒暄、结构化提取 TODO / 灵感 / 通知 / 摘要。',
    'AI 智能赋能：自动萃取标题、智能打标签、敏感凭据预警、笔记润色与结构化、每日想法复盘。',
    '端到端加密保险箱：PIN + AES 加密，密钥仅存用户脑海，服务端零明文。',
    '多维时间轴：日历视图、分类检索、标签聚合、JSON 备份导出与恢复。',
])

H('三、应用场景')
B([
    '通勤 / 会议中的碎片灵感速记与待办沉淀。',
    '微信群聊重要结论一键转为结构化笔记。',
    '个人密码 / 凭据的零知识加密保管。',
    '每日复盘：AI 生成日报总结，回顾当日想法。',
])

H('四、解决的实际问题')
B([
    '碎片想法易丢：极速入口大幅降低记录摩擦。',
    '聊天记录噪音大：AI 萃取可执行的要点与待办。',
    '隐私焦虑：端到端加密，服务端无法解密任何明文。',
    '模型成本高 / 合规：用户自配 Key + 国内合规模型（智谱 / DeepSeek）+ 本地兜底。',
])

H('五、技术开发方案')
B([
    '前端：微信原生小程序（WXML / WXSS / JS），tabBar 五页（极速记录 / 日历 / 分类 / 保险箱 / 设置）。',
    '存储层：以 wx.getStorageSync / wx.setStorageSync 替代浏览器 localStorage。',
    '加密保险箱：因小程序逻辑层无 window.crypto，使用 crypto-js 实现 PBKDF2 + AES 重写端到端加密，PIN 派生密钥，服务端仅存密文。',
    '语音录入：wx.getRecorderManager 录音 + 微信同声传译插件 / 服务端 ASR（演示版支持键盘输入兜底）。',
    '后端：复用 Express 服务，提供 /api/ai/classify-and-summarize、/api/ai/polish、'
    '/api/ai/parse-wechat-chat、/api/ai/daily-digest 标准 REST 接口；支持 DeepSeek / 智谱 / 自定义多模型，用户自配 Key 优先。',
    '网络与安全：全站 HTTPS，请求域名加入微信白名单；模型 Key 仅存本地，绝不落服务端。',
    '工程约束：主包 < 2MB，分包策略；setData 批量；隐私协议与授权合规。',
])

H('六、小程序创新点')
B([
    '用户自配大模型 Key，零服务端密钥依赖，隐私与成本双友好。',
    '端到端加密保险箱（PIN + AES），服务端零明文，真正零知识。',
    '微信聊天记录一键萃取，大模型结构化提炼可执行的 TODO / 灵感。',
    '多模型热切换 + 本地启发式兜底，无 Key 也能基础归档。',
    '极速灵感闪记交互（首页置顶胶囊 + 底部加号），贴合微信单手习惯。',
])

H('七、团队情况')
P('（请补充：团队成员姓名、分工、所属单位 / 学校；每位队员身份证件按大赛要求上传。）')

H('八、引用与非团队成员成果说明')
P('如使用了第三方开源库 / 模型 / 组件，请在此列明名称、License 与用途。本项目后端依赖 Express、'
  '@google/genai、openai 等；前端为微信原生实现；加密使用 crypto-js（MIT）。如有引用非团队成员开发成果，务必在此说明。')

doc.build(story)
print('PDF generated ->', OUT)
