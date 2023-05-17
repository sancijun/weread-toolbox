import type { PlasmoCSConfig } from "plasmo"

import $ from 'jquery';
import { resetScreen, setScreen } from "./content-utils";
import { initDomChangeObserver } from "./content-dom";
import { initMessage } from "./content-message";
import { exportBookMarks } from "./content-exporter";

export const config: PlasmoCSConfig = {
    matches: ["*://weread.qq.com/web/reader/*"],
    run_at: "document_end",
    all_frames: true
}

initDomChangeObserver();
initMessage();
// 解除右键限制
window.addEventListener("contextmenu",function(t) {
    t.stopImmediatePropagation();
},true);

// 
$(document).ready(function () {

    for (var i = 1; i < 99999; i++) {
        window.clearInterval(i);
    }

    // 重置样式
    var _css = ``

    $('body').prepend(`<style>${_css}</style>`)

    // 助手Bar
    var rightColor = '#595a5a'
    if ($('.readerControls_item.white').length > 0) {
        rightColor = 'white'
    }

    var _right_nav = $(`
        <a id="webook_master" title="助手" class="readerControls_item">
            <span class="" style="font-weight: bold; color: ${rightColor} ;">助手</span>
        </a>
    `)

    // 当前宽度
    var _def_max_width = 0
    var _app_content = $('.app_content')
    if (_app_content) {
        var _max_width = _app_content.css('max-width')
        if (_max_width) {
            var _px = Number.parseInt(_max_width.replace('px', ''))
            if (_px) {
                _def_max_width = _px
            }
        }
    }

    // 助手面板
    var _webookBox = $(`
    <div id="webook_box" class="wr_dialog" style="display: none;">
      <div class="wr_dialog_mask"></div>
      <div class="wr_dialog_container wr_dialog_bg">
        <a class="wr_dialog_closeButton webook_dialog_closeButton">close</a>
        <div style="width: 200px;">
          <div style="margin-top: 40px; margin-bottom: 40px; display: flex; padding: 5px; font-size: 14px; align-items: center; flex-direction: column;">

            <div class="webook_box_btn" id="webook_export_all_note" style="width: 140px; background-color: #2196F3; color: white; padding: 3px 10px; margin: 5px; cursor: pointer; border-radius: 4px;">
              导出全书笔记到剪贴板
            </div>
            <div class="webook_box_btn" id="webook_export_best_note" style="width: 140px; background-color: #2196F3; color: white; padding: 3px 10px; margin: 5px; cursor: pointer; border-radius: 4px;">
              导出热门笔记到剪贴板
            </div>
            <div style="margin-top: 10px; color: #c7c6c6; font-size: 13px;">设置背景</div>
            <div style="display: flex; flex-direction: row; margin-top: 5px;">
              <div id="webook_ui_1" style="background-color: #e2e2e4; width: 24px; height: 24px; margin: 0 5px; cursor: pointer;" data-color="#e2e2e4"></div>
              <div id="webook_ui_2" style="background-color: #e1dac7; width: 24px; height: 24px; margin: 0 5px; cursor: pointer;" data-color="#e1dac7"></div>
              <div id="webook_ui_3" style="background-color: #b3d6b4; width: 24px; height: 24px; margin: 0 5px; cursor: pointer;" data-color="#b3d6b4"></div>
              <div id="webook_ui_4" style="background-color: #ffc107; width: 24px; height: 24px; margin: 0 5px; cursor: pointer;" data-color="#ffc107"></div>
            </div>

            <div style="margin-top: 10px; color: #c7c6c6; font-size: 13px;">调整屏幕</div>
            <div style="display: flex; flex-direction: row; margin-top: 5px;">
              <div id="webook_screen_1_0" style="color: #a1a1a1; margin: 0 5px; cursor: pointer; font-size: 13px;">默认</div>
              <div id="webook_screen_1_2" style="color: #a1a1a1; margin: 0 5px; cursor: pointer; font-size: 13px;">1.2</div>
              <div id="webook_screen_1_4" style="color: #a1a1a1; margin: 0 5px; cursor: pointer; font-size: 13px;">1.4</div>
              <div id="webook_screen_1_6" style="color: #a1a1a1; margin: 0 5px; cursor: pointer; font-size: 13px;">1.6</div>
              <div id="webook_screen_2_0" style="color: #a1a1a1; margin: 0 5px; cursor: pointer; font-size: 13px;">2.0</div>
            </div>

          </div>
        </div>
      </div>
     </div>
    `)

    if (window.location.pathname.startsWith('/web/reader/')) {

        setTimeout(function () {
            $('.readerControls').prepend(_right_nav)
            $('body').append(_webookBox)

            $('#webook_master').click(function () {
                $('#webook_box').show()
            })

            $('.webook_dialog_closeButton').click(function () {
                $('#webook_box').hide()
                $('#webook_assist_box').hide()
            })
            // 导出笔记
            $('#webook_export_all_note').click(function (idx, ele) {
                exportBookMarks(false);
            })
            // 导出笔记
            $('#webook_export_best_note').click(function (idx, ele) {
                exportBookMarks(true);
            })
            chrome.storage.local.get(['webook_ui'], function (result) {
                let webook_ui = result.webook_ui
                if (webook_ui) {
                    let _obj = $(`#${webook_ui}`)
                    if (_obj.length > 0) {
                        _obj[0].click()
                    }
                }
            })

            function set_webook_ui(color) {
                var _w = $('.readerControls_item.white')
                if (_w.length > 0) {
                    $('.readerControls_item.white')[0].click()
                }
                $('.readerChapterContent').css('background-color', color)
                $('.app_content').css('background-color', color)
                $('.readerTopBar').css('background-color', color)
                $('.wr_canvasContainer canvas').css('background-color', color)
                $('#webook_master span').css('color', '#595a5a')
            }

            // 设置屏幕宽度
            $('#webook_screen_1_0').click(function () {
                resetScreen()
                chrome.storage.local.remove('webook_screen')
            })

            $('#webook_screen_1_2').click(function () {
                setScreen(_def_max_width * 1.2)
                chrome.storage.local.set({ 'webook_screen': '1.2' })
            })

            $('#webook_screen_1_4').click(function () {
                setScreen(_def_max_width * 1.4)
                chrome.storage.local.set({ 'webook_screen': '1.4' })
            })

            $('#webook_screen_1_6').click(function () {
                setScreen(_def_max_width * 1.6)
                chrome.storage.local.set({ 'webook_screen': '1.6' })
            })

            $('#webook_screen_2_0').click(function () {
                setScreen(_def_max_width * 2.0)
                chrome.storage.local.set({ 'webook_screen': '2.0' })
            })

            $('#webook_ui_1').click(function (e) {
                console.log('webook_ui_1')
                let _c = $(this).data('color')
                chrome.storage.local.set({ 'webook_ui': 'webook_ui_1' })
                set_webook_ui(_c)
            })
            // 主题颜色
            $('#webook_ui_2').click(function (e) {
                console.log('webook_ui_2')
                let _c = $(this).data('color')
                chrome.storage.local.set({ 'webook_ui': 'webook_ui_2' })
                set_webook_ui(_c)
            })

            $('#webook_ui_3').click(function (e) {
                console.log('webook_ui_3')
                let _c = $(this).data('color')
                chrome.storage.local.set({ 'webook_ui': 'webook_ui_3' })
                set_webook_ui(_c)
            })

            $('#webook_ui_4').click(function (e) {
                console.log('webook_ui_4')
                let _c = $(this).data('color')
                chrome.storage.local.set({ 'webook_ui': 'webook_ui_4' })
                set_webook_ui(_c)
            })

            $('.readerControls_item.dark').click(function (e) {
                $('.readerChapterContent').css('background-color', '')
                $('.app_content').css('background-color', '')
                $('.readerTopBar').css('background-color', '')
                $('.wr_canvasContainer canvas').css('background-color', '')
                chrome.storage.local.set({ 'webook_ui': null })
                let rightColor = '#595a5a'
                if ($('.readerControls_item.white').length > 0) {
                    rightColor = 'white'
                }
                $('#webook_master span').css('color', rightColor)
            })

            $('.readerControls_item.white').click(function (e) {
                console.log('click dark')
                $('.readerChapterContent').css('background-color', '')
                $('.app_content').css('background-color', '')
                $('.readerTopBar').css('background-color', '')
                $('.wr_canvasContainer canvas').css('background-color', '')
                chrome.storage.local.set({ 'webook_ui': null })
                var rightColor = '#595a5a'
                if ($('.readerControls_item.white').length > 0) {
                    rightColor = 'white'
                }
                $('#webook_master span').css('color', rightColor)
            })
        }, 1000)

        chrome.storage.local.get('webook_screen', function (result) {
            var screen = result.webook_screen
            if (screen && Number.parseFloat(screen)) {
                setScreen(_def_max_width * Number.parseFloat(screen))
            }
        })
    }

})
