$(function(){
    
    var x; //x座標
    var y;//y座標
    //ユーザーの現在の位置情報を取得
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
    
    /***** ユーザーの現在の位置情報を取得 *****/
    function successCallback(position) {
        x = position.coords.longitude;
        y = position.coords.latitude;
        
        var MyLatLng = new google.maps.LatLng(y, x);
        var Options = {
            zoom: 15,      //地図の縮尺値
            center: MyLatLng,    //地図の中心座標
            mapTypeId: 'roadmap'   //地図の種類
        };
        var map = new google.maps.Map(document.getElementById("map"), Options);
      
    }
    
    
    /***** 位置情報が取得できない場合 *****/
    function errorCallback(error) {
      var err_msg = "";
      switch(error.code)
      {
        case 1:
          err_msg = "位置情報の利用が許可されていません";
          break;
        case 2:
          err_msg = "デバイスの位置が判定できません";
          break;
        case 3:
          err_msg = "タイムアウトしました";
          break;
      }
      console.log(err_msg);
    }
    
    let week = ["日", "月", "火", "水", "木", "金", "土"];
    let today = new Date();
    // 月末だとずれる可能性があるため、1日固定で取得
    var showDate = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // 初期表示
    window.onload = function () {
        showProcess(today, calendar);
    };
    
    // 前の月表示
    function prev(){
        showDate.setMonth(showDate.getMonth() - 1);
        showProcess(showDate);
    }
    
    // 次の月表示
    function next(){
        showDate.setMonth(showDate.getMonth() + 1);
        showProcess(showDate);
    }
    
    // カレンダー表示
    function showProcess(date) {
        var year = date.getFullYear();
        var month = date.getMonth();
        document.getElementById('header').innerHTML = year + "年 " + (month + 1) + "月";
    
        var calendar = createProcess(year, month);
        document.getElementById('calendar').innerHTML = calendar;
    }
    
    // showProcess(today);
    
    // カレンダー作成
    function createProcess(year, month) {
        // 曜日
        var calendar = "<table><tr class='dayOfWeek'>";
        for (var i = 0; i < week.length; i++) {
            calendar += "<th>" + week[i] + "</th>";
        }
        calendar += "</tr>";
    
        var count = 0;
        var startDayOfWeek = new Date(year, month, 1).getDay();
        var endDate = new Date(year, month + 1, 0).getDate();
        var lastMonthEndDate = new Date(year, month, 0).getDate();
        var row = Math.ceil((startDayOfWeek + endDate) / week.length);
    
        // 1行ずつ設定
        for (var i = 0; i < row; i++) {
            calendar += "<tr>";
            // 1colum単位で設定
            for (var j = 0; j < week.length; j++) {
                if (i == 0 && j < startDayOfWeek) {
                    // 1行目で1日まで先月の日付を設定
                    calendar += "<td class='disabled'>" + (lastMonthEndDate - startDayOfWeek + j + 1) + "</td>";
                } else if (count >= endDate) {
                    // 最終行で最終日以降、翌月の日付を設定
                    count++;
                    calendar += "<td class='disabled'>" + (count - endDate) + "</td>";
                } else {
                    // 当月の日付を曜日に照らし合わせて設定
                    count++;
                    if(year == today.getFullYear()
                      && month == (today.getMonth())
                      && count == today.getDate()){
                        calendar += "<td class='today'>" + count + "<form action='/createplan'>" + "<input type='text' name='body'>" + "<input type='hidden' name='date' value=" + count + ">" + "<input type='submit'>" + "</td>";
                    } else {
                        calendar += "<td>" + count + "<form action='/createplan'>" + "<input type='text' name='body'>" + "<input type='hidden' name='date' value=" + count + ">" + "<input type='submit'>" + "</form>" + "</td>";
                    }
                }
            }
            calendar += "</tr>";
        }
        return calendar;
    }
    
    
    //投稿
    var post = function(){
        
        var content = $(".content").val();
        var category = $(".category").val();
        
        $.ajax({
            url: "/post",
            type: "POST",
            data: {
                x: x,
                y: y,
                content: content,
                category: category
            },
            dataType: "json"
        }).then(function(data){
            var contribution = $(`<div class="contribution">
                    <img src="${data.postimg}">
                    <div class="station">
                        <span class="name">${data.station}</span>
                    </div>
                    <p>${data.content}</p>
                    <p>${data.category}</p>
                    <p>${data.time}</p>
                </div>`
            );
            
            $(".contributions").prepend(contribution);
        });
        
        return false;
        
    };
    
    $(".postbtn").click(post)
    
    //フォロー
    var clickFollowBtn = function(){
        var id = $(this).data("id");
        
        $.ajax({
          url: "/follow",
          type: "POST",
          data: {
            id: id
          },
          dataType: "json"
        }).then(function(data){
          if (data["following"]) {
            $(".followbtn").text("フォロー解除");
          } else {
            $(".followbtn").text("フォローする");
          }
        });
        
        return false;
        
    };
    
    $(".followbtn").click(clickFollowBtn);
    
});

