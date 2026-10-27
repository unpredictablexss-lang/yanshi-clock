# 内置音频说明

除 `rain-window.mp3` 外，其余音源由项目内 `scripts/generate-audio.js` 以数学波形和确定性伪随机噪声程序化生成。雨声使用 Wikimedia Commons 上的 CC0 实录素材处理而成，详见 `SOURCE.md`。发布时环境音编码为 24kbps、短音效编码为 32kbps 单声道 MP3；所有图片和音频合计低于微信代码质量检查的 200KB。

包含：

- 提醒音：铜铃、翻页、古琴拨弦
- 环境音：细雨书窗、山林微风、古琴循环、空室静籁

重新生成程序音频原始 WAV：`node scripts/generate-audio.js`。源 WAV 默认写入项目外的 `../音频源文件备份/`，随后需重新编码为同名 MP3 放入本目录。

重新下载并处理雨声原始 WAV：`python scripts/import-rain-source.py`。源 WAV 默认写入项目外的 `../音频源文件备份/`，随后需重新编码为 `rain-window.mp3` 放入本目录。
