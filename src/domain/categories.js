import { BookOpen, Dumbbell, Lightbulb, Newspaper, Smartphone, Sprout, Ticket } from 'lucide-react';

export const categories = {
  idea: { label: '点子灵感', icon: Lightbulb, color: '--c-idea', subtitle: '记一句闪现的念头', content: '灵感内容', required: true },
  book: { label: '读书', icon: BookOpen, color: '--c-book', subtitle: '今天读到了什么', tags: '书名', content: '学到的智慧', gain: '我能改变的点', required: true },
  skill: { label: '学习技能', icon: Sprout, color: '--c-skill', subtitle: '学了什么新东西', tags: '技能标签', content: '学习内容' },
  exercise: { label: '运动', icon: Dumbbell, color: '--c-exercise', subtitle: '动一动，记一笔', tags: '运动类型', content: '备注' },
  news: { label: '新闻', icon: Newspaper, color: '--c-news', subtitle: '看到了什么，想到了什么', content: '看了什么新闻', gain: '感触', required: true },
  fun_offline: { label: '线下娱乐', icon: Ticket, color: '--c-fun-offline', subtitle: '线下的放松时光', content: '娱乐内容', gain: '收获', required: true },
  fun_phone: { label: '手机娱乐', icon: Smartphone, color: '--c-fun-phone', subtitle: '手机里的消遣', content: '娱乐内容', gain: '收获', required: true },
};

export const categoryIds = Object.keys(categories);
export const tagCategories = categoryIds.filter((id) => categories[id].tags);

export function categoryStyle(category) {
  const { color } = categories[category];
  return { '--category': `var(${color})` };
}
