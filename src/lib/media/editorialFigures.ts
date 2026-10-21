import type { EditorialFigureData } from "../../components/media/EditorialFigure.astro";
import cajal from "../../assets/editorial/cajal-cortex.png";
import cubes from "../../assets/editorial/ambiguous-cubes.png";
import governor from "../../assets/editorial/centrifugal-governor.png";
import leonardo from "../../assets/editorial/leonardo-gears.jpg";
import lovelace from "../../assets/editorial/lovelace-note-g.jpg";

/** Historical references accompany the content; they are not modern research results. */
export const editorialFigures = {
  cajal: {
    id: "cajal-cortex", src: cajal, title: "皮层的层次与连接", creator: "Santiago Ramón y Cajal", date: "1899",
    alt: "Cajal绘制的三组大脑皮层组织图，细密的细胞与神经纤维沿不同层次排列。",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Cajal_cortex_drawings.png", sourceLabel: "Wikimedia Commons",
    rights: "公共领域；原作1899年，数字文件组合于2009年。",
    note: "来自Cajal对人类大脑皮层的比较研究。层次、连接与局部结构，为这组系统研究笔记提供一个历史观察视角。"
  },
  cubes: {
    id: "ambiguous-cubes", src: cubes, title: "同一线条，不同解释", creator: "Joseph Jastrow《The Mind’s Eye》中的插图，绘者未署名", date: "1899",
    alt: "一幅含对角线的立方体线框，以及以不同粗线强调的两种空间读法。",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:PSM_V54_D324_Optical_illusion_with_cubes.png", sourceLabel: "Popular Science Monthly / Commons",
    rights: "公共领域；1899年原文中的图13、13a和13b。",
    note: "试着分别观察中间和右侧的粗线，再回看左图。相同视觉线索可以支持不同空间解释，这里以它作为讨论感知与判断不确定性的历史参照。"
  },
  governor: {
    id: "centrifugal-governor", src: governor, title: "让反馈进入系统", creator: "R. Routledge著作中的历史插图", date: "1900",
    alt: "离心调速器与节流阀的机械连接图，保留原图中的部件字母与英文图题。",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Centrifugal_governor.png", sourceLabel: "Routledge / Wikimedia Commons",
    rights: "公共领域；《Discoveries & Inventions of the Nineteenth Century》第13版插图。",
    note: "调速器把转速变化反馈到阀门控制。感知、反馈与动作在同一机制中形成闭环，为理解系统工程中的反馈提供直观参照。"
  },
  leonardo: {
    id: "leonardo-gears", src: leonardo, title: "把整体展开来看", creator: "Leonardo da Vinci", date: "复制出版于1894–1904",
    alt: "达芬奇齿轮装置手稿的历史复制图，左侧为装配结构，右侧为展开的部件，周围有手写标注。",
    sourceUrl: "https://www.loc.gov/item/2006681098/", sourceLabel: "Library of Congress",
    rights: "公共领域历史复制图；美国国会图书馆标示无已知出版限制。原手稿年份未确定。",
    note: "装配图与分解图把整体、部件和旁注放在同一张纸上。对局部的标注始终保留与整体的关系，呼应这里对段落上下文与方法拆解的关注。"
  },
  lovelace: {
    id: "lovelace-note-g", src: lovelace, title: "把思路写成步骤", creator: "Ada Lovelace", date: "1843",
    alt: "Ada Lovelace的Note G伯努利数计算表，以行列记录操作顺序、变量与中间结果。",
    sourceUrl: "https://collection.sciencemuseumgroup.org.uk/objects/co8652385/book-sketch-of-the-analytical-engine-invented-by-charles-babbage-esq", sourceLabel: "Science Museum Group",
    rights: "公共领域；图像来自Wikimedia Commons。出版年据Science Museum原书记录为1843年。",
    note: "Note G把计算展开为可追踪的操作序列。打开完整图版，可以看到步骤、变量和中间结果如何被组织在一张表中。"
  }
} satisfies Record<string, EditorialFigureData>;

export const researchFigures = [editorialFigures.cajal, editorialFigures.cubes, editorialFigures.governor];
export const topicFigures: Record<string, EditorialFigureData> = {
  "knowledge-network": editorialFigures.cajal,
  "paragraph-review": editorialFigures.leonardo,
  "exam-review": editorialFigures.cubes,
  "agent-engineering": editorialFigures.governor,
  "ai-coding": editorialFigures.lovelace
};
export const conceptFigures: Record<string, EditorialFigureData> = {
  "anchor-id": editorialFigures.leonardo,
  "optimistic-ui": editorialFigures.governor
};
export const paperReferenceFigure = editorialFigures.lovelace;
