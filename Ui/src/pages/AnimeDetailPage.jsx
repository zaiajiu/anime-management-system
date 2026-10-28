import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, EditIcon } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { fetchAnimeById, updateAnime } from '@/api/anime';
import logger from '@/utils/logger';

// ============================================================
// 配置
// ============================================================
var BACKEND = 'http://localhost:8080';

// ============================================================
// 工具：内联 SVG 兜底图
// ============================================================
function getDefaultImage(label) {
  var text = '无图';
  if (label !== null && label !== undefined && label !== '') {
    text = label;
  }
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="266">' +
      '<rect width="100%" height="100%" fill="#eeeeee"/>' +
      '<text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#999999" font-size="16">' +
        text +
      '</text>' +
    '</svg>';
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function getImageUrl(path) {
  if (path === null || path === undefined || path === '') {
    return getDefaultImage('未上传');
  }
  if (path.indexOf('http') === 0) {
    return path;
  }
  return BACKEND + path;
}

// ============================================================
// 详情页
// ============================================================
export default function AnimeDetailPage() {
  // 从路由里拿 id
  var params = useParams();
  var id = params.id;

  var navigate = useNavigate();

  // ============================================================
  // 状态
  // ============================================================
  var animeState = useState(null);
  var anime = animeState[0];
  var setAnime = animeState[1];

  var loadingState = useState(true);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var errorState = useState('');
  var error = errorState[0];
  var setError = errorState[1];

  // 编辑弹窗开关
  var editOpenState = useState(false);
  var editOpen = editOpenState[0];
  var setEditOpen = editOpenState[1];

  // ============================================================
  // 加载详情
  // ============================================================
  function loadAnime() {
    logger.debug('AnimeDetailPage', '加载详情', { id: id });
    setLoading(true);
    setError('');

    fetchAnimeById(id)
      .then(function (res) {
        if (res.success === false) {
          setError(res.message);
        } else {
          setAnime(res.data);
        }
      })
      .catch(function (err) {
        logger.error('AnimeDetailPage', '加载详情失败', err);
        setError('加载失败：' + err.message);
      })
      .finally(function () {
        setLoading(false);
      });
  }

  useEffect(function () {
    loadAnime();
  }, [id]);

  // ============================================================
  // 图片错误兜底
  // ============================================================
  function handleImageError(event) {
    var img = event.currentTarget;
    if (img.dataset.failed === '1') {
      return;
    }
    img.dataset.failed = '1';
    img.src = getDefaultImage('加载失败');
  }

  // ============================================================
  // 返回上一页
  // ============================================================
  function handleBack() {
    navigate(-1);
  }

  // ============================================================
  // 编辑成功回调
  // ============================================================
  function handleEditSuccess() {
    setEditOpen(false);
    loadAnime();               // 重新拉详情
  }

  // ============================================================
  // 渲染
  // ============================================================

  // 加载中
  if (loading === true) {
    return <div className="p-6 text-muted-foreground">加载中...</div>;
  }

  // 出错
  if (error !== '') {
    return (
      <div className="p-6 space-y-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={handleBack}>返回</Button>
      </div>
    );
  }

  // 没数据
  if (anime === null) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-muted-foreground">动漫不存在</p>
        <Button variant="outline" onClick={handleBack}>返回</Button>
      </div>
    );
  }

  // 正常
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* ============ 顶部工具栏 ============ */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeftIcon className="size-4 mr-2" />
          返回
        </Button>
        <Button onClick={function () { setEditOpen(true); }}>
          <EditIcon className="size-4 mr-2" />
          修改
        </Button>
      </div>

      {/* ============ 主体内容 ============ */}
      <Card className="overflow-hidden">
        <div className="flex flex-col md:flex-row">

          {/* 封面 */}
          <div className="md:w-64 shrink-0">
            <img
              src={getImageUrl(anime.imagePath)}
              alt={anime.animeName}
              className="w-full md:h-full aspect-[3/4] object-cover bg-muted"
              onError={handleImageError}
            />
          </div>

          {/* 信息 */}
          <CardContent className="flex-1 p-6 space-y-4">
            <CardTitle className="text-2xl">{anime.animeName}</CardTitle>

            <div>
              <div className="text-sm text-muted-foreground mb-1">简介</div>
              <p className="whitespace-pre-wrap">{anime.animeIntroduction || '（无）'}</p>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">观后感</div>
              <p className="whitespace-pre-wrap">{anime.animeComment || '（无）'}</p>
            </div>

            <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
              <div>ID：{anime.id}</div>
              <div>创建时间：{anime.createTime || '-'}</div>
              <div>更新时间：{anime.updateTime || '-'}</div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* ============ 编辑弹窗 ============ */}
      <EditAnimeDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        anime={anime}
        onSuccess={handleEditSuccess}
      />

    </div>
  );
}


// ============================================================
// 内嵌的编辑弹窗组件（也可以拆到独立文件）
// ============================================================
function EditAnimeDialog(props) {
  var open = props.open;
  var onOpenChange = props.onOpenChange;
  var anime = props.anime;
  var onSuccess = props.onSuccess;

  // 表单状态
  var formState = useState({ animeName: '', animeIntroduction: '', animeComment: '' });
  var form = formState[0];
  var setForm = formState[1];

  var coverFileState = useState(null);
  var coverFile = coverFileState[0];
  var setCoverFile = coverFileState[1];

  var previewState = useState('');
  var preview = previewState[0];
  var setPreview = previewState[1];

  var submittingState = useState(false);
  var submitting = submittingState[0];
  var setSubmitting = submittingState[1];

  // 每次打开时，用 anime 初始化表单
  useEffect(function () {
    if (open === true && anime !== null) {
      setForm({
        animeName: anime.animeName || '',
        animeIntroduction: anime.animeIntroduction || '',
        animeComment: anime.animeComment || ''
      });
      setCoverFile(null);
      setPreview('');
    }
  }, [open, anime]);

  function handleFileChange(event) {
    var file = event.target.files[0];
    if (file === null || file === undefined) {
      return;
    }
    if (file.type.indexOf('image/') !== 0) {
      alert('请选择图片文件');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('图片不能超过 5MB');
      return;
    }
    setCoverFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (form.animeName.trim() === '') {
      alert('请输入动漫名称');
      return;
    }

    setSubmitting(true);

    updateAnime(anime.id, {
      animeName: form.animeName,
      animeIntroduction: form.animeIntroduction,
      animeComment: form.animeComment,
      image: coverFile
    })
      .then(function (res) {
        if (res.success === false) {
          alert(res.message);
          return;
        }
        logger.info('EditAnimeDialog', '修改成功', { id: anime.id });
        onSuccess();
      })
      .catch(function (error) {
        logger.error('EditAnimeDialog', '修改失败', error);
        alert('修改失败：' + error.message);
      })
      .finally(function () {
        setSubmitting(false);
      });
  }

  function handleClose() {
    if (submitting === true) {
      return;
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={function (v) { if (v === false) handleClose(); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>修改动漫</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* 封面 */}
          <div className="space-y-2">
            <Label htmlFor="edit-image">封面（不选则保留原图）</Label>
            <Input id="edit-image" type="file" accept="image/*" onChange={handleFileChange} />
            {(preview !== '' || anime.imagePath) && (
              <img
                src={preview !== '' ? preview : getImageUrl(anime.imagePath)}
                alt="封面"
                className="mt-2 w-32 aspect-[3/4] object-cover rounded-md border"
              />
            )}
          </div>

          {/* 名称 */}
          <div className="space-y-2">
            <Label htmlFor="edit-animeName">动漫名称</Label>
            <Input
              id="edit-animeName"
              value={form.animeName}
              onChange={function (e) { setForm({ animeName: e.target.value, animeIntroduction: form.animeIntroduction, animeComment: form.animeComment }); }}
            />
          </div>

          {/* 简介 */}
          <div className="space-y-2">
            <Label htmlFor="edit-animeIntroduction">简介</Label>
            <Textarea
              id="edit-animeIntroduction"
              rows={4}
              value={form.animeIntroduction}
              onChange={function (e) { setForm({ animeName: form.animeName, animeIntroduction: e.target.value, animeComment: form.animeComment }); }}
            />
          </div>

          {/* 观后感 */}
          <div className="space-y-2">
            <Label htmlFor="edit-animeComment">观后感</Label>
            <Textarea
              id="edit-animeComment"
              rows={4}
              value={form.animeComment}
              onChange={function (e) { setForm({ animeName: form.animeName, animeIntroduction: form.animeIntroduction, animeComment: e.target.value }); }}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting === true ? '提交中...' : '保存'}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}