<template>
  <div class="dashboard-wrapper">
    <div class="dashboard-container"
         ref="dashboardContainerRef"
         :style="containerStyle">
      <div class="dashboard-background"></div>
      <div class="dashboard-overlay"></div>
      <!-- 顶部标题栏 -->
      <div class="dashboard-header">
        <div class="header-left">
          <h1>Epiroc GIA Q6i 矿山设备实时智能监控</h1>
        </div>
        <div class="header-right">
          <span class="ws-status" :class="wsStatus">
            <span class="ws-dot" :class="wsStatus"></span>
            {{ wsStatusText }}
          </span>
          <span class="user-info">用户: {{ username }}</span>
          <span class="current-time">{{ currentTime }}</span>
          <button class="fullscreen-btn" @click="toggleFullscreen">
            {{ isFullscreen ? '退出全屏' : '全屏' }}
          </button>
          <button class="logout-btn" @click="handleLogout">登出</button>
        </div>
      </div>

      <div class="dashboard-content">
        <!-- 左：实时设备监控-->
        <div class="dashboard-left">
          <div class="dashboard-panel panel-device-monitor">
            <div class="panel-header">
              <h2>实时设备监控</h2>
              <span class="panel-status">在线: {{ onlineDeviceCount }}/2</span>
            </div>
            <div class="panel-content">
              <!-- 设备卡片 -->
              <div v-for="device in targetDevices"
                   :key="device.remoteId"
                   class="device-card"
                   :class="device.status">
                <!-- 设备头部 -->
                <div class="device-header">
                  <div class="device-name">
                    <span class="status-dot" :class="device.status"></span>
                    {{ device.name }}
                    <span class="device-remote-id">{{ device.remoteId }}</span>
                  </div>
                  <div class="device-update-time">
                    <el-icon :class="{ 'icon-rotating': device.isRefreshing }">
                      <RefreshLeft/>
                    </el-icon>
                    {{ device.updateTime || '--' }}
                  </div>
                </div>

                <div class="device-main">
                  <!-- 设备主体内容 -->
                  <div class="device-main-content">
                    <!-- 实时钻进数据 -->
                    <div class="device-section">
                      <h4 class="section-title">实时钻进</h4>
                      <div class="param-container">
                        <div class="param-item">
                          <label>杆数</label>
                          <span class="param-value">{{ device.joints || 0 }}</span>
                        </div>
                        <div class="param-item">
                          <label>钻头深度</label>
                          <span class="param-value">{{ (device.currentDepth || 0).toFixed(1) }} m</span>
                        </div>
                        <div class="param-item">
                          <label>钻进深度</label>
                          <span class="param-value">{{ (device.drillDepth || 0).toFixed(1) }} m</span>
                        </div>
                        <div class="param-item">
                          <label>钻进速度</label>
                          <span class="param-value">{{ (device.drillSpeed || 0).toFixed(1) }}m/min</span>
                        </div>
                      </div>
                    </div>

                    <!-- 当日生产数据 -->
                    <div class="device-section">
                      <h4 class="section-title">当日生产</h4>
                      <div class="param-container">
                        <div class="param-item">
                          <label>当日钻进深度</label>
                          <span class="param-value highlight">{{ device.dayDepth || 0 }} m</span>
                        </div>
                        <div class="param-item">
                          <label>当日钻孔</label>
                          <span class="param-value highlight">{{ device.drillDay || 0 }}</span>
                        </div>
                        <div class="param-item">
                          <label>利用率</label>
                          <span class="param-value highlight">{{ ((device.utilizationRatio || 0) * 100).toFixed(1) }}%</span>
                        </div>
                        <div class="param-item">
                          <label>每发动机小时钻米</label>
                          <span class="param-value highlight">{{ (device.depthPerEngineHour || 0).toFixed(1) }}m/h</span>
                        </div>
                      </div>
                    </div>

                    <!-- 当日工作小时 -->
                    <div class="device-section">
                      <div class="section-desc">
                        <h4 class="section-title">
                          当日工作小时（总计
                          {{ (device.totalWorkHours || 0).toFixed(1) }}h）
                        </h4>
                        <div class="mode-legend">
                          <span class="legend-item"><i class="legend-dot drill-mode">
                          </i>凿岩{{ (device.drillModeHours || 0).toFixed(1) }}h</span>
                          <span class="legend-item"><i class="legend-dot tramming-mode"></i>行走
                            {{
                              (device.trammingModeHours || 0).toFixed(1)
                            }}h</span>
                          <span class="legend-item"><i class="legend-dot median-mode"></i>中位
                            {{
                              (device.medianModeHours || 0).toFixed(1)
                            }}h</span>
                        </div>
                      </div>
                      <div class="work-hours-bar">
                        <div class="bar-segment drill-mode"
                             :style="{ width: device.drillModePercent + '%' }"
                             :title="`凿岩模式: ${(
                            device.drillModeHours || 0
                          ).toFixed(1)}h (${device.drillModePercent}%)`">
                          <span v-if="device.drillModePercent > 15">{{ device.drillModePercent }}%</span>
                        </div>
                        <div
                            class="bar-segment tramming-mode"
                            :style="{ width: device.trammingModePercent + '%' }"
                            :title="`行走模式: ${(
                            device.trammingModeHours || 0
                          ).toFixed(1)}h (${device.trammingModePercent}%)`">
                          <span v-if="device.trammingModePercent > 15">{{ device.trammingModePercent }}%</span>
                        </div>
                        <div class="bar-segment median-mode"
                             :style="{ width: device.medianModePercent + '%' }"
                             :title="`中位模式: ${(
                            device.medianModeHours || 0 ).toFixed(1)}h (${device.medianModePercent}%)`">
                          <span v-if="device.medianModePercent > 15">{{ device.medianModePercent }}%</span>
                        </div>
                      </div>
                    </div>

                    <!-- 当日油耗 -->
                    <div class="device-section">
                      <div class="section-desc">
                        <h4 class="section-title">
                          当日油耗（总计
                          {{ (device.totalFuel || 0).toFixed(0) }}L）
                        </h4>
                        <div class="mode-legend">
                          <span class="legend-item"><i class="legend-dot fuel-drill"></i>凿岩
                            {{ (device.fuelDrill || 0).toFixed(0) }}L</span>
                          <span class="legend-item"><i class="legend-dot fuel-tramming"></i>行走
                            {{ (device.fuelTramming || 0).toFixed(0) }}L</span>
                          <span class="legend-item"><i class="legend-dot fuel-median"></i>中位
                            {{ (device.fuelMedian || 0).toFixed(0) }}L</span>
                        </div>
                      </div>
                      <div class="fuel-bar">
                        <div class="bar-segment fuel-drill"
                             :style="{ width: device.fuelDrillPercent + '%' }"
                             :title="`凿岩模式: ${(device.fuelDrill || 0).toFixed( 0 )}L (${device.fuelDrillPercent}%)`">
                          <span v-if="device.fuelDrillPercent > 5">{{ device.fuelDrillPercent }}%</span>
                        </div>
                        <div
                            class="bar-segment fuel-tramming"
                            :style="{ width: device.fuelTrammingPercent + '%' }"
                            :title="`行走模式: ${(
                            device.fuelTramming || 0
                          ).toFixed(0)}L (${device.fuelTrammingPercent}%)`">
                          <span v-if="device.fuelTrammingPercent > 5">{{ device.fuelTrammingPercent }}%</span>
                        </div>
                        <div
                            class="bar-segment fuel-median"
                            :style="{ width: device.fuelMedianPercent + '%' }"
                            :title="`中位模式: ${(device.fuelMedian || 0).toFixed(
                            0
                          )}L (${device.fuelMedianPercent}%)`">
                          <span v-if="device.fuelMedianPercent > 5">{{ device.fuelMedianPercent }}%</span>
                        </div>
                      </div>
                    </div>

                    <!-- 日历图 -->
                    <div class="device-section">
                      <div class="section-calendar">
                        <h4 class="section-title">设备利用率日历</h4>
                        <div class="device-utilization-calendar"
                             :ref="
                            (el) => {
                              if (el) device.calendarRef = el
                            }"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：图表区域 (70%) -->
        <div class="dashboard-right">
          <!-- 综合指标带 -->
          <div class="kpi-row">
            <div class="kpi-card">
              <span class="kpi-value">{{ todayDrillMetersDisplay }} m</span>
              <span class="kpi-label">当日总钻进深度</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-value">{{ todayDrillDepthDisplay }}</span>
              <span class="kpi-label">当日总钻孔数</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-value">{{ realtimeEngineLoadDisplay }} %</span>
              <span class="kpi-label">实时平均发动机负荷</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-value">{{ totalFuelDisplay }} L</span>
              <span class="kpi-label">当日总油耗</span>
            </div>
          </div>

          <!-- 右上：生产统计分析 -->
          <div class="dashboard-panel panel-statistics">
            <div class="panel-header">
              <h2>生产统计分析（钻孔作业）</h2>
              <div class="header-right-section">
                <div class="device-legend">
                  <span class="legend-item">
                    <i class="legend-dot device-17"/>盖亚17号
                  </span>
                  <span class="legend-item">
                    <i class="legend-dot device-25"/>盖亚25号
                  </span>
                </div>
                <div class="time-range-indicator">
                  <span class="range-label">时间范围： </span>
                  <span class="range-value">{{ currentTimeRangeLabel }}</span
                  >每月统计周期：上月26日-本月25日
                </div>
              </div>
            </div>
            <div class="panel-content statistics-grid-new">
              <div class="chart-container chart-left"
                   ref="drillComboChart"></div>
              <div class="chart-container chart-right"
                   ref="workHoursChart"></div>
            </div>
          </div>

          <!-- 右下：工作时间分析 -->
          <div class="dashboard-panel panel-energy">
            <div class="panel-header">
              <h2>工作时间分析（凿岩/行走/中位）</h2>
              <!--     <span class="energy-total">总油耗: {{ totalFuel }} L</span>-->
              <div class="time-range-indicator">
                <span class="range-label">时间范围： </span>
                <span class="range-value">{{ currentTimeRangeLabel }}</span
                >每月统计周期：上月26日-本月25日
              </div>
            </div>
            <div class="panel-content energy-grid">
              <div class="chart-container af1"
                   ref="workHoursSunburstChart"></div>
              <div class="chart-container af23"
                   ref="deviceComparisonWorkHoursChart"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  nextTick,
  markRaw,
} from 'vue'
import { useRouter } from 'vue-router'
import { logout, getUsername } from '@/utils/auth'
import * as echarts from 'echarts'
import {
  getDevices,
  getActiveAlarms,
  getGpsLocations,
  getDailyStatistics,
  getStatisticsTrends,
  getStatisticsAggregated,
  getStatisticsMonthly,
} from '@/api'
import { RefreshLeft } from '@element-plus/icons-vue'

const router = useRouter()
const username = ref(getUsername())
const currentTime = ref('')
const isFullscreen = ref(false)
const wsStatus = ref('disconnected')
const wsStatusText = computed(() => {
  const statusMap = {
    connected: '服务已连接',
    connecting: '服务连接中...',
    disconnected: '服务未连接',
    error: '服务连接错误',
  }
  return statusMap[wsStatus.value] || '未知状态'
})

const DESIGN_WIDTH = 3840
const DESIGN_HEIGHT = 2160
const dashboardContainerRef = ref(null)
const containerStyle = ref({
  width: `${DESIGN_WIDTH}px`,
  height: `${DESIGN_HEIGHT}px`,
  transformOrigin: 'top left',
  transform: 'scale(1)',
  marginLeft: '0px',
  marginTop: '0px',
})

const updateDashboardScale = () => {
  if (!dashboardContainerRef.value) {
    console.warn('Dashboard容器引用不存在')
    return
  }

  const viewportWidth = window.innerWidth || DESIGN_WIDTH
  const viewportHeight = window.innerHeight || DESIGN_HEIGHT
  if (viewportWidth <= 0 || viewportHeight <= 0) {
    console.warn('视口尺寸无效:', viewportWidth, viewportHeight)
    return
  }

  const scaleX = viewportWidth / DESIGN_WIDTH
  const scaleY = viewportHeight / DESIGN_HEIGHT

  let scale = Math.min(scaleX, scaleY)

  const is1080p =
      viewportWidth >= 1900 &&
      viewportWidth <= 1920 &&
      viewportHeight >= 1000 &&
      viewportHeight <= 1080

  let resolutionType = 'Other'
  if (is1080p) {
    scale = 0.5
    resolutionType = '1080p'
  } else if (viewportWidth >= 3840) {
    resolutionType = '4K'
  }

  const scaledWidth = DESIGN_WIDTH * scale
  const scaledHeight = DESIGN_HEIGHT * scale

  const left = (viewportWidth - scaledWidth) / 2
  const top = (viewportHeight - scaledHeight) / 2

  containerStyle.value = {
    width: `${DESIGN_WIDTH}px`,
    height: `${DESIGN_HEIGHT}px`,
    transformOrigin: 'top left',
    transform: `scale(${scale})`,
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
  }

  console.log('缩放更新:', {
    分辨率: resolutionType,
    视口: `${viewportWidth}x${viewportHeight}`,
    缩放比例: scale.toFixed(4),
    缩放后尺寸: `${Math.round(scaledWidth)}x${Math.round(scaledHeight)}`,
    偏移: `left:${left.toFixed(2)}px, top:${top.toFixed(2)}px`,
    容器样式: containerStyle.value,
  })

  // 添加分辨率标识到body，用于CSS适配
  document.body.classList.remove('resolution-1080p', 'resolution-4k')
  if (is1080p) {
    document.body.classList.add('resolution-1080p')
  } else if (viewportWidth >= 3840) {
    document.body.classList.add('resolution-4k')
  }
}

const TIME_RANGES = ['week', 'biweek', 'month']
const currentTimeRange = ref('week')
const currentTimeRangeIndex = ref(0)
let timeRangeSwitchInterval = null

const SWITCH_INTERVAL_SECONDS = parseInt(
    import.meta.env.VITE_CHART_SWITCH_INTERVAL_SECONDS || '6',
    10
)

const getMonthlyRealData = async () => {
  try {
    const response = await getStatisticsMonthly({months: 6})

    if (response.code !== 200 || !response.data) {
      console.error('月度数据API响应异常:', response)
      return null
    }

    const {data, meta} = response
    const device17Id = 'Epiroc131FD100011'
    const device25Id = 'Epiroc120GD100018'

    const device17Data = data[device17Id] || []
    const device25Data = data[device25Id] || []

    if (device17Data.length === 0 && device25Data.length === 0) {
      console.warn('月度数据为空')
      return null
    }

    // 提取月份标签（格式：2025-11 → 11月）
    const dates = device17Data.map((item) => {
      const monthStr = item.month.split('-')[1] // "2025-11" → "11"
      return `${parseInt(monthStr)}月`
    })

    const dateRangeNote = meta?.dateRangeNote

    const device17 = device17Data.map((item) => ({
      dateRange: item.dateRange, // 保留日期范围用于图表标注
      drilling: {
        depth: item.drilling.totalDepth,
        holes: item.drilling.totalHoles,
      },
      efficiency: {
        depthPerEngineHour: item.efficiency.avgDepthPerHour,
        utilizationRatio: item.efficiency.avgUtilizationRatio,
        fuelPerMeter: item.efficiency.avgFuelPerMeter,
      },
      workHours: {
        total: item.workHours.total,
        drillMode: item.workHours.drillMode,
        trammingMode: item.workHours.trammingMode,
        medianMode: item.workHours.medianMode,
      },
      fuel: {
        total: item.fuel.total,
      },
    }))

    // 转换设备25数据
    const device25 = device25Data.map((item) => ({
      dateRange: item.dateRange,
      drilling: {
        depth: item.drilling.totalDepth,
        holes: item.drilling.totalHoles,
      },
      efficiency: {
        depthPerEngineHour: item.efficiency.avgDepthPerHour,
        utilizationRatio: item.efficiency.avgUtilizationRatio,
        fuelPerMeter: item.efficiency.avgFuelPerMeter,
      },
      workHours: {
        total: item.workHours.total,
        drillMode: item.workHours.drillMode,
        trammingMode: item.workHours.trammingMode,
        medianMode: item.workHours.medianMode,
      },
      fuel: {
        total: item.fuel.total,
      },
    }))

    console.log('转换后的月度数据:', {
      dates,
      device17,
      device25,
      dateRangeNote,
    })

    return {
      dates,
      device17,
      device25,
      dateRangeNote,
    }
  } catch (error) {
    console.error('获取月度数据失败:', error)
    return null
  }
}

const trendsData = ref({})
const aggregatedData = ref([])

const targetDevices = ref([
  {
    remoteId: 'Epiroc131FD100011',
    name: '盖亚17号',
    status: 'online',
    updateTime: '--',
    isRefreshing: false,
    // 实时钻进
    joints: 0,
    currentDepth: 0,
    drillDepth: 0,
    drillSpeed: 0,
    totalDepth: 0,
    engineLoad: 0,
    // 当日生产
    dayDepth: 0,
    drillDay: 0,
    utilizationRatio: 0,
    depthPerEngineHour: 0,
    // 当日工作小时
    totalWorkHours: 0,
    drillModeHours: 0,
    trammingModeHours: 0,
    medianModeHours: 0,
    drillModePercent: 0,
    trammingModePercent: 0,
    medianModePercent: 0,
    // 当日油耗
    totalFuel: 0,
    fuelDrill: 0,
    fuelTramming: 0,
    fuelMedian: 0,
    fuelDrillPercent: 0,
    fuelTrammingPercent: 0,
    fuelMedianPercent: 0,
    // 利用率历史（用于日历图）
    utilizationHistory: [],
    calendarRef: null,
    calendarChartInstance: null,
  },
  {
    remoteId: 'Epiroc120GD100018',
    name: '盖亚25号',
    status: 'online',
    updateTime: '--',
    isRefreshing: false,
    // 实时钻进
    joints: 0,
    currentDepth: 0,
    drillDepth: 0,
    drillSpeed: 0,
    totalDepth: 0,
    engineLoad: 0,
    // 当日生产
    dayDepth: 0,
    drillDay: 0,
    utilizationRatio: 0,
    depthPerEngineHour: 0,
    // 当日工作小时
    totalWorkHours: 0,
    drillModeHours: 0,
    trammingModeHours: 0,
    medianModeHours: 0,
    drillModePercent: 0,
    trammingModePercent: 0,
    medianModePercent: 0,
    // 当日油耗
    totalFuel: 0,
    fuelDrill: 0,
    fuelTramming: 0,
    fuelMedian: 0,
    fuelDrillPercent: 0,
    fuelTrammingPercent: 0,
    fuelMedianPercent: 0,
    // 利用率历史（用于日历图）
    utilizationHistory: [],
    calendarRef: null,
    calendarChartInstance: null,
  },
])

const activeAlarms = ref([])
const statisticsPeriod = ref('week')
const totalFuel = ref(0)

let drillComboChartInstance = null
let workHoursChartInstance = null
let workHoursSunburstChartInstance = null
let deviceComparisonWorkHoursChartInstance = null

const insideLabelStyle = {
  position: 'inside',
  color: '#fff',
  fontSize: 24,
  textShadowColor: 'rgba(0, 0, 0, 0.6)',
  textShadowBlur: 4,
  textShadowOffsetX: 1,
  textShadowOffsetY: 1,
}
const axisLabelStyle = {color: '#fff', fontSize: 26}
const nameTextStyle = {color: '#fff', fontSize: 28}
const titleTextStyle = {color: '#fff', fontSize: 36, fontWeight: 'bold'}

const currentTimeRangeLabel = computed(() => {
  const labels = {
    week: '近7日',
    biweek: '近14日',
    month: '近6个月',
  }
  return labels[currentTimeRange.value] || '近7日'
})

const onlineDeviceCount = computed(() => {
  return targetDevices.value.filter((d) => d.status === 'online').length
})

const todayDrillDepth = computed(() => {
  return targetDevices.value.reduce((sum, device) => {
    return sum + (Number(device.dayDepth) || 0)
  }, 0)
})

const todayDrillDepthDisplay = computed(() => {
  return targetDevices.value.reduce((sum, device) => {
    return sum + (Number(device.drillDay) || 0)
  }, 0)
})

const realtimeEngineLoad = computed(() => {
  if (targetDevices.value.length === 0) return 0
  const total = targetDevices.value.reduce((sum, device) => {
    return sum + (Number(device.engineLoad) || 0)
  }, 0)
  return total / targetDevices.value.length
})

const realtimeEngineLoadDisplay = computed(() => {
  return realtimeEngineLoad.value.toFixed(0)
})

const todayDrillMeters = computed(() => {
  return targetDevices.value.reduce((sum, device) => {
    return sum + (Number(device.dayDepth) || 0)
  }, 0)
})

const todayDrillMetersDisplay = computed(() => {
  return todayDrillMeters.value.toLocaleString(undefined, {
    maximumFractionDigits: 1,
  })
})

const totalFuelDisplay = computed(() => {
  return totalFuel.value.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })
})

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

const handleLogout = () => {
  logout()
  router.push('/login')
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
      isFullscreen.value = false
    }
  }
}

let ws = null
const connectWebSocket = () => {
  wsStatus.value = 'connecting'
  const wsUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3001'
  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    console.log('WebSocket连接成功')
    wsStatus.value = 'connected'
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      if (data.type === 'realtime_update') {
        if (data.data.devices) {
          updateDeviceData(data.data.devices)
        }

        if (data.data.alarms) {
          activeAlarms.value = data.data.alarms.slice(0, 10)
        }
      }
    } catch (error) {
      console.error('WebSocket数据解析错误:', error)
    }
  }

  ws.onerror = (error) => {
    console.error('WebSocket错误:', error)
    wsStatus.value = 'error'
  }

  ws.onclose = () => {
    console.log('WebSocket连接关闭，5秒后重连...')
    wsStatus.value = 'disconnected'
    setTimeout(connectWebSocket, 5000)
  }
}

const updateDeviceData = (devices) => {
  if (!Array.isArray(devices)) return

  devices.forEach((device) => {
    const targetDevice = targetDevices.value.find(
        (d) => d.remoteId === device.remoteId
    )
    if (targetDevice) {
      targetDevice.isRefreshing = !targetDevice.isRefreshing

      if (device.drilling) {
        targetDevice.joints = device.drilling.joints || 0
        targetDevice.currentDepth = device.drilling.currentDepth || 0
        targetDevice.drillDepth = device.drilling.drillDepth || 0
        targetDevice.drillSpeed =
            device.drilling.speed || device.drilling.drillSpeed || 0
        targetDevice.totalDepth = device.drilling.totalDepth || 0
      }
      if (device.engine) {
        targetDevice.engineLoad = device.engine.load || 0
      }
      if (device.today) {
        targetDevice.dayDepth = device.today.depth || 0
        targetDevice.drillDay = device.today.holes || 0
        targetDevice.utilizationRatio = device.today.utilizationRatio || 0
        targetDevice.depthPerEngineHour = device.today.depthPerEngineHour || 0

        // 工作小时
        if (device.today.workHours) {
          targetDevice.totalWorkHours = device.today.workHours.total || 0
          targetDevice.drillModeHours = device.today.workHours.drillMode || 0
          targetDevice.trammingModeHours =
              device.today.workHours.trammingMode || 0
          targetDevice.medianModeHours = device.today.workHours.medianMode || 0

          // 百分比
          const totalHours = targetDevice.totalWorkHours
          if (totalHours > 0) {
            targetDevice.drillModePercent = Math.round(
                (targetDevice.drillModeHours / totalHours) * 100
            )
            targetDevice.trammingModePercent = Math.round(
                (targetDevice.trammingModeHours / totalHours) * 100
            )
            targetDevice.medianModePercent = Math.round(
                (targetDevice.medianModeHours / totalHours) * 100
            )
          }
        }

        // 油耗
        if (device.today.fuel) {
          targetDevice.totalFuel = device.today.fuel.total || 0
          targetDevice.fuelDrill = device.today.fuel.drillMode || 0
          targetDevice.fuelTramming = device.today.fuel.trammingMode || 0
          targetDevice.fuelMedian = device.today.fuel.medianMode || 0

          // 百分比
          const totalFuel = targetDevice.totalFuel
          if (totalFuel > 0) {
            targetDevice.fuelDrillPercent = Math.round(
                (targetDevice.fuelDrill / totalFuel) * 100
            )
            targetDevice.fuelTrammingPercent = Math.round(
                (targetDevice.fuelTramming / totalFuel) * 100
            )
            targetDevice.fuelMedianPercent = Math.round(
                (targetDevice.fuelMedian / totalFuel) * 100
            )
          }
        }
      }
      if (device.timestamp?.device) {
        const timeStr = device.timestamp.device
        targetDevice.updateTime = timeStr // timeStr.split(' ')[1] || timeStr
      }

      if (device.joints !== undefined) targetDevice.joints = device.joints
      if (device.currentDepth !== undefined)
        targetDevice.currentDepth = device.currentDepth
      if (device.drillDepth !== undefined)
        targetDevice.drillDepth = device.drillDepth
      if (device.drillSpeed !== undefined)
        targetDevice.drillSpeed = device.drillSpeed
      if (device.engineLoad !== undefined)
        targetDevice.engineLoad = device.engineLoad
      if (device.totalDepth !== undefined)
        targetDevice.totalDepth = device.totalDepth
      if (device.status !== undefined) targetDevice.status = device.status

      if (device.deviceName) targetDevice.name = device.deviceName
      if (device.aliasName) targetDevice.name = device.aliasName

      console.log(`更新设备数据: ${targetDevice.name}`, {
        joints: targetDevice.joints,
        currentDepth: targetDevice.currentDepth,
        drillDepth: targetDevice.drillDepth,
        dayDepth: targetDevice.dayDepth,
        totalWorkHours: targetDevice.totalWorkHours,
        totalFuel: targetDevice.totalFuel,
      })
    }
  })
}

const loadDeviceCalendarData = async () => {
  try {
    // 修改为获取最近一年的数据
    const response = await getStatisticsTrends({range: 'year'})

    if (response.code === 200 && response.data) {
      targetDevices.value.forEach((device) => {
        const deviceData = response.data[device.remoteId]

        if (deviceData && Array.isArray(deviceData)) {
          device.utilizationHistory = deviceData.map((item) => {
            const utilizationRatio = item.efficiency?.utilizationRatio || 0
            return [
              item.date,
              (utilizationRatio * 100).toFixed(1), // 转为百分比（0-100）
            ]
          })

          console.log(
              `${device.name}利用率历史数据（365天）:`,
              device.utilizationHistory.length,
              '条'
          )
        } else {
          device.utilizationHistory = []
        }
      })

      initDeviceCalendarCharts()
    }
  } catch (error) {
    console.error('加载设备日历数据失败:', error)
  }
}

const initSingleDeviceCalendar = (device) => {
  if (!device.calendarRef) return

  device.calendarChartInstance?.dispose()

  const chartInstance = echarts.init(device.calendarRef)

  // 获取日期范围（最近一年）
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 364) // 365天前

  const option = {
    tooltip: {
      position: 'top',
      backgroundColor: 'rgba(0, 20, 40, 0.9)',
      borderColor: 'rgba(0, 255, 100, 0.5)',
      borderWidth: 1,
      textStyle: {color: '#00ff88', fontSize: 24},
      formatter: (params) => {
        const date = params.value[0]
        const value = params.value[1]
        return `<strong>${date}</strong><br/>利用率: <strong>${value}%</strong>`
      },
    },
    visualMap: {
      show: true,
      min: 0,
      max: 100,
      right: -13,
      top: -5,
      type: 'continuous',
      orient: 'horizontal',
      text: ['高', '利用率 低'],
      textStyle: {color: '#fff', fontSize: 24},
      inRange: {
        color: [
          'rgba(50, 200, 100, 0.10)', // 0-9%: 极浅绿
          'rgba(45, 205, 95, 0.25)', // 9-18%: 很浅绿
          'rgba(40, 210, 90, 0.40)', // 18-27%: 浅绿
          'rgba(35, 215, 85, 0.55)', // 27-36%: 较浅绿
          'rgba(30, 220, 80, 0.70)', // 36-45%: 中浅绿
          'rgba(25, 225, 75, 0.99)', // 45-54%: 中绿
          'rgba(20, 230, 70, 0.99)', // 54-63%: 中深绿
          'rgba(15, 235, 65, 0.99)', // 63-72%: 较深绿
          'rgba(10, 240, 60, 0.99)', // 72-81%: 深绿
          'rgba(5, 250, 55, 0.99)', // 81-90%: 很深绿
          'rgba(0, 255, 50, 1.0)', // 90-100%: 最深绿
        ],
      },
      calculable: false,
      itemWidth: 15,
      itemHeight: 80,
    },
    calendar: {
      top: 90,
      left: 3,
      right: 3,
      bottom: 3,
      range: [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
      ],
      orient: 'horizontal',
      cellSize: ['auto', 7],
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgba(25,189,86,0.55)',
          width: 2,
          type: 'solid',
        },
      },
      itemStyle: {
        color: 'transparent',
        borderWidth: 0.5,
        borderColor: 'rgba(40, 180, 80, 0.25)',
        borderType: 'solid',
      },
      yearLabel: {
        show: true,
        fontSize: 24,
        color: 'rgba(0, 255, 100, 0.9)',
        fontWeight: 'bold',
        margin: 20,
        formatter: '近一年利用率',
      },
      monthLabel: {
        show: true,
        fontSize: 24,
        color: 'rgba(0, 255, 100, 0.8)',
        fontWeight: 'bold',
        margin: 5,
        nameMap: [
          '1月',
          '2月',
          '3月',
          '4月',
          '5月',
          '6月',
          '7月',
          '8月',
          '9月',
          '10月',
          '11月',
          '12月',
        ],
      },
      dayLabel: {
        show: false,
        fontSize: 24,
        color: 'rgba(255, 255, 255, 0.6)',
        firstDay: 1,
        margin: 3,
        nameMap: ['一', '二', '三', '四', '五', '六', '日'],
      },
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: device.utilizationHistory || [],
        label: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            borderColor: 'rgba(0, 255, 100, 1)',
            borderWidth: 2,
            shadowBlur: 10,
            shadowColor: 'rgba(0, 255, 100, 0.6)',
          },
        },
      },
    ],
  }

  chartInstance.setOption(option, {
    notMerge: true, // true 确保完全重新渲染
    lazyUpdate: false, // false 确保立即更新
  })

  device.calendarChartInstance = chartInstance

  setTimeout(chartInstance.resize, 100)

  console.log(`${device.name}日历图初始化完成`)
}

const initDeviceCalendarCharts = () => {
  const needsRetry = []

  targetDevices.value.forEach((device) => {
    if (device.calendarChartInstance) {
      console.log(`${device.name} 日历图已存在，跳过`)
      return
    }

    console.log(`检查设备 ${device.name}:`, {
      hasCalendarRef: !!device.calendarRef,
      historyCount: device.utilizationHistory?.length || 0,
    })

    if (!device.calendarRef) {
      console.warn(`${device.name} 的 calendarRef 不存在`)
      needsRetry.push(device.name)
      return
    }

    const containerWidth = device.calendarRef.offsetWidth
    const containerHeight = device.calendarRef.offsetHeight

    console.log(`${device.name} 容器尺寸:`, {
      width: containerWidth,
      height: containerHeight,
    })

    if (containerWidth === 0 || containerHeight === 0) {
      console.warn(`${device.name} 容器尺寸为0，等待布局完成...`)
      needsRetry.push(device.name)
      return
    }

    try {
      initSingleDeviceCalendar(device)
    } catch (error) {
      console.error(`${device.name} 日历图初始化出错:`, error)
      needsRetry.push(device.name)
    }
  })

  // requestAnimationFrame( initDeviceCalendarCharts )
  console.log('✅ 所有设备日历图初始化成功！')
}

const initCharts = async () => {
  await nextTick()

  // 右上：生产统计分析（2个图表）
  initDrillComboChart() // 图表1：钻进深度和钻孔数混合图（左侧）
  initWorkHoursChart() // 图表2：发动机工作时间堆叠条形图（右侧，每天一条，两台设备对比）

  // 右下：工作时间分析（2个图表）
  initWorkHoursSunburstChart() // 图表4：工作时间旭日图
  initDeviceComparisonWorkHoursChart() // 图表5：两台设备工作时间正负对比图

  // 加载统计数据
  await loadStatisticsData()

  console.log('所有图表初始化完成')
}

// 图表1：钻进深度和钻孔数混合图（折柱混合）
const initDrillComboChart = () => {
  const chartDom = document.querySelector(
      '.panel-statistics .statistics-grid-new .chart-left'
  )
  if (!chartDom) return

  drillComboChartInstance = echarts.init(chartDom)

  const option = {
    title: {
      text: '钻进深度与钻孔数趋势',
      left: 'center',
      top: 10,
      textStyle: {...titleTextStyle},
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {type: 'cross'},
      confine: true,
      textStyle: {fontSize: 24},
    },
    legend: {show: false},
    grid: [
      {
        // 折线图（钻进深度）
        left: '4%',
        right: '2%',
        top: '12%',
        height: '32%',
        containLabel: true,
      },
      {
        // 柱状图（钻孔数）
        left: '4%',
        right: '2%',
        top: '57%',
        bottom: '2%',
        containLabel: true,
      },
    ],
    xAxis: [
      {
        // 上方X轴：折线图使用
        gridIndex: 0,
        type: 'category',
        data: [],
        axisLine: {lineStyle: {color: '#5470c6'}},
        axisLabel: {...axisLabelStyle, rotate: 30, show: false},
      },
      {
        // 下方X轴：柱状图使用
        gridIndex: 1,
        type: 'category',
        data: [],
        axisLine: {lineStyle: {color: '#91cc75'}},
        axisLabel: {...axisLabelStyle, rotate: 30, margin: 22},
      },
    ],
    yAxis: [
      {
        // 上方Y轴：钻进深度（折线图）
        gridIndex: 0,
        type: 'value',
        name: '钻进深度(m)',
        position: 'left',
        nameGap: 25,
        nameTextStyle: {...nameTextStyle},
        axisLine: {lineStyle: {color: '#5470c6'}},
        axisLabel: {...axisLabelStyle},
        splitLine: {lineStyle: {color: '#2a3f5f'}},
      },
      {
        // 下方Y轴：钻孔数（柱状图）
        gridIndex: 1,
        type: 'value',
        name: '钻孔数',
        position: 'left',
        nameGap: 25,
        nameTextStyle: {...nameTextStyle},
        axisLine: {lineStyle: {color: '#91cc75'}},
        axisLabel: {...axisLabelStyle},
        splitLine: {lineStyle: {color: '#2a3f5f', type: 'dashed'}},
      },
    ],
    series: [
      {
        name: '盖亚17号钻进深度',
        type: 'line',
        xAxisIndex: 0,
        yAxisIndex: 0,
        smooth: true,
        data: [],
        itemStyle: {color: '#00d9ff'},
        lineStyle: {width: 2},
        label: {
          show: true,
          position: 'top',
          color: '#00d9ff',
          fontSize: 26,
          formatter: '{c}m',
        },
      },
      {
        name: '盖亚25号钻进深度',
        type: 'line',
        xAxisIndex: 0,
        yAxisIndex: 0,
        smooth: true,
        data: [],
        itemStyle: {color: '#00ff88'},
        lineStyle: {width: 2},
        label: {
          show: true,
          position: 'top',
          color: '#00ff88',
          fontSize: 26,
          formatter: '{c}m',
        },
      },
      {
        name: '盖亚17号钻孔',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: [],
        itemStyle: {color: 'rgba(0, 217, 255, 0.6)'},
        barMaxWidth: 20,
        label: {
          show: true,
          position: 'top',
          color: '#00d9ff',
          fontSize: 26,
          formatter: '{c}',
        },
      },
      {
        name: '盖亚25号钻孔',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: [],
        itemStyle: {color: 'rgba(0, 255, 136, 0.6)'},
        barMaxWidth: 20,
        label: {
          show: true,
          position: 'top',
          color: '#00ff88',
          fontSize: 26,
          formatter: '{c}',
        },
      },
    ],
  }

  drillComboChartInstance.setOption(option)
}

// 图表2：钻进效率气泡图（X=每发动机小时钻米, Y=平均油耗, 气泡大小=发动机利用率）
const initWorkHoursChart = () => {
  const chartDom = document.querySelector(
      '.panel-statistics .statistics-grid-new .chart-right'
  )
  if (!chartDom) return

  workHoursChartInstance = echarts.init(chartDom)

  const option = {
    title: [
      {
        text: '钻进效率气泡分析（平均油耗 vs 每发动机小时钻米）',
        left: 'center',
        top: 10,
        textStyle: {...titleTextStyle},
      },
      {
        text: '气泡大小代表发动机利用率，越靠右上效率越高',
        left: 'center',
        top: 55,
        textStyle: {
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: 26,
          fontWeight: 'normal',
        },
      },
    ],
    tooltip: {
      trigger: 'item',
      confine: true,
      textStyle: {fontSize: 24},
      formatter: (params) => {
        const data = params.data
        return `<strong>${params.seriesName}</strong><br/>
                日期: ${data[3]}<br/>
                每发动机小时钻米: ${data[0]?.toFixed(1)} m/h<br/>
                平均油耗: ${data[1]?.toFixed(1)} L/m<br/>
                发动机利用率: ${data[2]?.toFixed(1)}%`
      },
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '8%',
      top: '16%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: '每发动机小时钻米 (m/h)',
      nameLocation: 'center',
      nameGap: 60,
      nameTextStyle: {...nameTextStyle},
      axisLine: {lineStyle: {color: '#5470c6'}},
      axisLabel: {...axisLabelStyle},
      splitLine: {lineStyle: {color: '#2a3f5f', type: 'dashed'}},
      min: 0,
    },
    yAxis: {
      type: 'value',
      name: '平均油耗 (L/m)',
      nameLocation: 'center',
      nameGap: 60,
      nameTextStyle: {...nameTextStyle},
      axisLine: {lineStyle: {color: '#5470c6'}},
      axisLabel: {...axisLabelStyle},
      splitLine: {lineStyle: {color: '#2a3f5f', type: 'dashed'}},
      min: 0,
      // max: 100,
      scale: true,
      inverse: true,
    },
    series: [
      {
        name: '盖亚17号',
        type: 'scatter',
        data: [], // 格式: [[x, y, size, date], ...] = [[depthPerHour, fuelPerMeter, utilizationRatio, date], ...]
        symbolSize: (data) => {
          // 根据发动机利用率计算气泡大小（最小16，最大80）
          const utilization = data[2] || 0
          return Math.max(16, Math.min(80, utilization * 2))
        },
        itemStyle: {
          color: 'rgba(0, 217, 255, 0.6)',
          borderColor: '#fff',
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: {
            color: 'rgba(0, 217, 255, 0.6)',
            opacity: 1,
            borderWidth: 2,
          },
        },
        label: {
          show: false,
        },
      },
      {
        name: '盖亚25号',
        type: 'scatter',
        data: [], // 格式: [[x, y, size, date], ...] = [[depthPerHour, fuelPerMeter, utilizationRatio, date], ...]
        symbolSize: (data) => {
          // 根据发动机利用率计算气泡大小（最小16，最大80）
          const utilization = data[2] || 0
          return Math.max(16, Math.min(80, utilization * 2))
        },
        itemStyle: {
          color: 'rgba(0, 255, 136, 0.6)',
          borderColor: '#fff',
          borderWidth: 1,
        },
        emphasis: {
          itemStyle: {
            color: 'rgba(0, 255, 136, 0.6)',
            opacity: 1,
            borderWidth: 2,
          },
        },
        label: {
          show: false,
        },
      },
    ],
  }

  workHoursChartInstance.setOption(option)
}

// 图表5：油耗趋势（堆叠面积图，3模式，响应时间范围）
// 图表4：发动机工作时间旭日图
const initWorkHoursSunburstChart = () => {
  const chartDom = document.querySelector(
      '.panel-energy .energy-grid .chart-container:nth-child(1)'
  )
  if (!chartDom) return

  workHoursSunburstChartInstance = echarts.init(chartDom)

  const option = {
    title: {
      text: '发动机总工作时间分析',
      left: 'center',
      top: 5,
      textStyle: {...titleTextStyle},
    },
    tooltip: {
      trigger: 'item',
      textStyle: {fontSize: 26},
      formatter: (params) => {
        if (params.data.value) {
          return `${params.name}<br/>工作时间: ${params.value.toFixed(
              1
          )}h<br/>占比: ${params.percent.toFixed(1)}%`
        }
        return params.name
      },
    },
    series: [
      {
        // 内圈：设备
        name: '设备',
        type: 'pie',
        center: ['50%', '55%'],
        radius: ['15%', '45%'],
        itemStyle: {
          borderRadius: 5,
          borderColor: '#1a1a2e',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'inside',
          fontSize: 32,
          fontWeight: 700,
          color: '#fff',
          textShadowColor: 'rgba(0, 0, 0, 0.8)',
          textShadowBlur: 4,
          textShadowOffsetX: 1,
          textShadowOffsetY: 1,
          formatter: (params) => {
            const value = params.value || 0
            return `${params.name}\n${value.toFixed(1)}h`
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          {name: '盖亚17号', value: 0, itemStyle: {color: '#00d9ff'}},
          {name: '盖亚25号', value: 0, itemStyle: {color: '#00ff88'}},
        ],
      },
      {
        // 外圈：工作模式
        name: '工作模式',
        type: 'pie',
        center: ['50%', '55%'],
        radius: ['45%', '72%'],
        itemStyle: {
          borderRadius: 5,
          borderColor: '#1a1a2e',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'outside',
          alignTo: 'edge',
          edgeDistance: '2%',
          minMargin: 10,
          fontSize: 28,
          color: '#fff',
          overflow: 'none',
          formatter: (params) => {
            const value = params.value || 0
            return `${params.name}\n${value.toFixed(1)}h`
          },
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 0,
          smooth: false,
          maxSurfaceAngle: 80,
          lineStyle: {width: 1.5},
        },
        data: [],
      },
    ],
  }

  workHoursSunburstChartInstance.setOption(option)
}

// 图表5：两台设备工作时间正负对比图（盖亚17号在左，盖亚25号在右）
const initDeviceComparisonWorkHoursChart = () => {
  const chartDom = document.querySelector(
      '.panel-energy .energy-grid .chart-container.af23'
  )
  if (!chartDom) return

  deviceComparisonWorkHoursChartInstance = echarts.init(chartDom)

  const option = {
    title: {
      text: currentTimeRangeLabel.value + '发动机日工作时间对比',
      left: 'center',
      top: 10,
      textStyle: {...titleTextStyle},
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {type: 'shadow'},
      confine: true,
      textStyle: {fontSize: 24},
      formatter: (params) => {
        const date = params[0].axisValue
        let result = `<strong>${date}</strong><br/>`

        // 分组显示盖亚17号和盖亚25号
        result +=
            '<div style="margin-top:5px;"><strong style="color:#00d9ff;">盖亚17号:</strong><br/>'
        let total17 = 0
        params.slice(0, 3).forEach((item) => {
          const absValue = Math.abs(parseFloat(item.value) || 0)
          total17 += absValue
          result += `${item.marker}${item.seriesName}: ${absValue.toFixed(
              1
          )}h<br/>`
        })
        result += `小计: <strong>${total17.toFixed(1)}h</strong></div>`

        result +=
            '<div style="margin-top:5px;"><strong style="color:#00ff88;">盖亚25号:</strong><br/>'
        let total25 = 0
        params.slice(3).forEach((item) => {
          const value = parseFloat(item.value) || 0
          total25 += value
          result += `${item.marker}${item.seriesName}: ${value.toFixed(
              1
          )}h<br/>`
        })
        result += `小计: <strong>${total25.toFixed(1)}h</strong></div>`

        return result
      },
    },
    legend: [
      {
        // 17号设备图例 - 居左
        data: ['17号-凿岩', '17号-行走', '17号-中位'],
        left: '7%',
        top: 50,
        textStyle: {color: '#fff', fontSize: 28},
        itemWidth: 22,
        itemHeight: 16,
      },
      {
        // 25号设备图例 - 居右
        data: ['25号-凿岩', '25号-行走', '25号-中位'],
        right: '7%',
        top: 50,
        textStyle: {color: '#fff', fontSize: 28},
        itemWidth: 22,
        itemHeight: 16,
      },
    ],
    grid: {
      left: '3%',
      right: '3%',
      bottom: '6%',
      top: '16%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: '发动机日工作时间 (h)',
      nameLocation: 'middle',
      nameGap: 45,
      nameTextStyle: {...nameTextStyle},
      axisLine: {
        lineStyle: {color: '#5470c6'},
      },
      axisLabel: {
        ...axisLabelStyle,
        formatter: (value) => Math.abs(value) + 'h',
      },
      splitLine: {
        show: true,
        lineStyle: {color: '#2a3f5f', type: 'dashed'},
      },
      axisPointer: {
        lineStyle: {
          color: 'rgba(0, 173, 239, 0.8)',
          width: 3,
        },
      },
    },
    yAxis: {
      type: 'category',
      data: [],
      axisLine: {
        lineStyle: {color: '#5470c6'},
      },
      axisLabel: {
        ...axisLabelStyle,
        align: 'right',
        overflow: 'none',
      },
      splitLine: {show: false},
    },
    series: [
      // 盖亚17号（左侧，负值）
      {
        name: '17号-凿岩',
        type: 'bar',
        stack: '发动机',
        data: [],
        itemStyle: {color: 'rgba(255, 107, 107, 0.8)'}, // 红色
        barWidth: '50%',
        barMaxWidth: 50,
        label: {
          show: true,
          position: 'inside',
          ...insideLabelStyle,
          formatter: (params) =>
              Math.abs(params.value) > 0.5
                  ? `${Math.abs(params.value).toFixed(1)}`
                  : '',
        },
        // 添加中间分隔线
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            color: 'rgba(0, 173, 239, 0.6)',
            width: 3,
            type: 'solid',
          },
          label: {
            show: true,
            position: 'insideEndTop',
            formatter: '盖亚17号',
            color: '#fff',
            fontSize: 28,
            distance: [-30, 15],
          },
          data: [{xAxis: 0}],
        },
      },
      {
        name: '17号-行走',
        type: 'bar',
        stack: '发动机',
        data: [],
        itemStyle: {color: 'rgba(78, 205, 196, 0.8)'}, // 青色
        label: {
          show: true,
          position: 'inside',
          ...insideLabelStyle,
          formatter: (params) =>
              Math.abs(params.value) > 0.5
                  ? `${Math.abs(params.value).toFixed(1)}`
                  : '',
        },
      },
      {
        name: '17号-中位',
        type: 'bar',
        stack: '发动机',
        data: [],
        itemStyle: {color: 'rgba(255, 230, 109, 0.8)'}, // 黄色
        label: {
          show: true,
          position: 'inside',
          ...insideLabelStyle,
          formatter: (params) =>
              Math.abs(params.value) > 0.5
                  ? `${Math.abs(params.value).toFixed(1)}`
                  : '',
        },
      },
      // 盖亚25号（右侧，正值）
      {
        name: '25号-凿岩',
        type: 'bar',
        stack: '发动机',
        data: [],
        itemStyle: {color: 'rgba(255, 107, 107, 0.8)'}, // 红色
        label: {
          show: true,
          position: 'inside',
          ...insideLabelStyle,
          formatter: (params) =>
              params.value > 0.5 ? `${params.value.toFixed(1)}` : '',
        },
        // 添加25号标签
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            width: 0,
          },
          label: {
            show: true,
            position: 'insideEndTop',
            formatter: '盖亚25号',
            color: '#fff',
            fontSize: 28,
            distance: [-30, -45],
          },
          data: [{xAxis: 0}],
        },
      },
      {
        name: '25号-行走',
        type: 'bar',
        stack: '发动机',
        data: [],
        itemStyle: {color: 'rgba(78, 205, 196, 0.8)'}, // 青色
        label: {
          show: true,
          position: 'inside',
          ...insideLabelStyle,
          formatter: (params) =>
              params.value > 0.5 ? `${params.value.toFixed(1)}` : '',
        },
      },
      {
        name: '25号-中位',
        type: 'bar',
        stack: '发动机',
        data: [],
        itemStyle: {color: 'rgba(255, 230, 109, 0.8)'}, // 黄色
        label: {
          show: true,
          position: 'inside',
          ...insideLabelStyle,
          formatter: (params) =>
              params.value > 0.5 ? `${params.value.toFixed(1)}` : '',
        },
      },
    ],
  }

  deviceComparisonWorkHoursChartInstance.setOption(option)
}

const loadTrendsAndAggregatedData = async (range = 'week') => {
  try {
    console.log(`加载趋势数据: range=${range}`)

    // 并行获取趋势数据和聚合数据（修复：传递对象参数）
    const [trendsResponse, aggregatedResponse] = await Promise.all([
      getStatisticsTrends({range}),
      getStatisticsAggregated({range}),
    ])

    if (trendsResponse?.code === 200) {
      trendsData.value = trendsResponse.data || {}
      console.log(`趋势数据加载成功 (${range}):`, trendsData.value)
    }

    if (aggregatedResponse?.code === 200) {
      aggregatedData.value = aggregatedResponse.data || []
      console.log(`聚合数据加载成功 (${range}):`, aggregatedData.value)
    }

    // 更新图表
    await updateStatisticsCharts()
  } catch (error) {
    console.error('加载趋势/聚合数据失败:', error)
  }
}

const loadStatisticsData = async (period = 'week') => {
  try {
    // 根据时间段计算天数
    let days = 7
    switch (period) {
      case 'week':
        days = 7 // 显示最近7天
        break
      case 'week2':
        days = 14 // 显示最近14天
        break
      case 'month':
        days = 30 // 显示最近30天
        break
      default:
        days = 7
    }

    console.log(`加载统计数据: 周期=${period}, 天数=${days}`)

    // 获取统计数据（优化：一次请求获取多天数据）
    const device17Promise = getDailyStatistics({
      remoteId: 'Epiroc131FD100011',
      limit: days,
    }).catch((err) => {
      console.error('获取盖亚17号统计失败:', err)
      return null
    })

    const device25Promise = getDailyStatistics({
      remoteId: 'Epiroc120GD100018',
      limit: days,
    }).catch((err) => {
      console.error('获取盖亚25号统计失败:', err)
      return null
    })

    const [device17Data, device25Data] = await Promise.all([
      device17Promise,
      device25Promise,
    ])

    console.log(`盖亚17号统计数据 (${period}):`, device17Data)
    console.log(`盖亚25号统计数据 (${period}):`, device25Data)

    // 更新图表数据
    updateChartsWithData(
        {
          device17: device17Data,
          device25: device25Data,
        },
        period
    )
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const updateStatisticsCharts = async () => {
  // 如果是月度数据，使用真实API数据
  if (currentTimeRange.value === 'month') {
    const monthlyData = await getMonthlyRealData()
    if (monthlyData) {
      updateChartsWithMonthlyData(monthlyData)
    } else {
      console.error('获取月度数据失败，图表不更新')
    }
    return
  }

  // 周和双周继续使用真实API数据
  if (
      !trendsData.value ||
      !aggregatedData.value ||
      aggregatedData.value.length === 0
  ) {
    console.warn('趋势或聚合数据不完整')
    return
  }

  const device17Trends = trendsData.value['Epiroc131FD100011'] || []
  const device25Trends = trendsData.value['Epiroc120GD100018'] || []
  const device17Agg = aggregatedData.value.find(
      (d) => d.remoteId === 'Epiroc131FD100011'
  )
  const device25Agg = aggregatedData.value.find(
      (d) => d.remoteId === 'Epiroc120GD100018'
  )

  console.log('盖亚17号趋势:', device17Trends)
  console.log('盖亚25号趋势:', device25Trends)
  console.log('盖亚17号聚合:', device17Agg)
  console.log('盖亚25号聚合:', device25Agg)

  const dates = device17Trends.map((item) => {
    const dateStr = item.date?.split(' ')[0] || ''
    return dateStr.substring(5)
  })

  // 图表1：钻进深度和钻孔数混合图（双网格布局）
  if (drillComboChartInstance) {
    drillComboChartInstance.setOption({
      xAxis: [
        {data: dates}, // 上方X轴（折线图）
        {data: dates}, // 下方X轴（柱状图）- 显示日期标签
      ],
      series: [
        {
          data: device17Trends.map((item) =>
              (item.drilling?.depth || 0).toFixed(0)
          ),
        }, // 盖亚17号钻进深度
        {
          data: device25Trends.map((item) =>
              (item.drilling?.depth || 0).toFixed(0)
          ),
        }, // 盖亚25号钻进深度
        {data: device17Trends.map((item) => item.drilling?.holes || 0)}, // 盖亚17号钻孔
        {data: device25Trends.map((item) => item.drilling?.holes || 0)}, // 盖亚25号钻孔
      ],
    })
  }

  // 图表2：发动机工作时间堆叠条形图（每天数据）
  if (
      workHoursChartInstance &&
      device17Trends.length > 0 &&
      device25Trends.length > 0
  ) {
    // 提取日期（只显示 MM-DD）
    // 构建气泡图数据：过滤掉效率为0的数据点（无效工作日）
    // 格式: [x=每发动机小时钻米, y=利用率(%), size=当日钻米, date]
    const device17BubbleData = device17Trends
        .filter((item) => (item.efficiency?.depthPerEngineHour || 0) > 0)
        .map((item) => {
          const dateStr = item.date?.split(' ')[0] || ''
          const shortDate = dateStr.substring(5) // MM-DD
          return [
            item.efficiency?.depthPerEngineHour || 0, // X轴：每发动机小时钻米
            item.efficiency?.fuelPerMeter || 0, // Y轴：平均油耗 (L/m)
            (item.efficiency?.utilizationRatio || 0) * 100, // 气泡大小：利用率转为百分比(0-100)
            shortDate, // 日期（用于tooltip）
          ]
        })

    const device25BubbleData = device25Trends
        .filter((item) => (item.efficiency?.depthPerEngineHour || 0) > 0)
        .map((item) => {
          const dateStr = item.date?.split(' ')[0] || ''
          const shortDate = dateStr.substring(5) // MM-DD
          return [
            item.efficiency?.depthPerEngineHour || 0, // X轴：每发动机小时钻米
            item.efficiency?.fuelPerMeter || 0, // Y轴：平均油耗 (L/m)
            (item.efficiency?.utilizationRatio || 0) * 100, // 气泡大小：利用率转为百分比(0-100)
            shortDate, // 日期（用于tooltip）
          ]
        })

    console.log(
        '钻进效率气泡图数据 - 盖亚17号:',
        device17BubbleData.length,
        '个有效数据点'
    )
    console.log(
        '钻进效率气泡图数据 - 盖亚25号:',
        device25BubbleData.length,
        '个有效数据点'
    )
    console.log('盖亚17号气泡数据示例:', device17BubbleData.slice(0, 2))
    console.log('盖亚25号气泡数据示例:', device25BubbleData.slice(0, 2))

    workHoursChartInstance.setOption({
      series: [
        {data: device17BubbleData}, // 盖亚17号气泡
        {data: device25BubbleData}, // 盖亚25号气泡
      ],
    })
  }

  // 图表4：工作时间旭日图
  if (
      workHoursSunburstChartInstance &&
      device17Trends.length > 0 &&
      device25Trends.length > 0
  ) {
    // 计算两台设备的总工作小时
    const device17TotalDrill = device17Trends.reduce(
        (sum, item) => sum + (item.workHours?.drillMode || 0),
        0
    )
    const device17TotalTramming = device17Trends.reduce(
        (sum, item) => sum + (item.workHours?.trammingMode || 0),
        0
    )
    const device17TotalMedian = device17Trends.reduce(
        (sum, item) => sum + (item.workHours?.medianMode || 0),
        0
    )
    const device17Total =
        device17TotalDrill + device17TotalTramming + device17TotalMedian

    const device25TotalDrill = device25Trends.reduce(
        (sum, item) => sum + (item.workHours?.drillMode || 0),
        0
    )
    const device25TotalTramming = device25Trends.reduce(
        (sum, item) => sum + (item.workHours?.trammingMode || 0),
        0
    )
    const device25TotalMedian = device25Trends.reduce(
        (sum, item) => sum + (item.workHours?.medianMode || 0),
        0
    )
    const device25Total =
        device25TotalDrill + device25TotalTramming + device25TotalMedian

    console.log('嵌套饼图数据 - 盖亚17总计:', device17Total.toFixed(1))
    console.log('嵌套饼图数据 - 盖亚25总计:', device25Total.toFixed(1))

    workHoursSunburstChartInstance.setOption({
      title: {
        text: currentTimeRangeLabel.value + '发动机总工作时间分析',
        textStyle: {...titleTextStyle},
      },
      series: [
        {
          // 内圈：设备数据
          data: [
            {
              name: '盖亚17号',
              value: device17Total,
              itemStyle: {color: '#00d9ff'},
            },
            {
              name: '盖亚25号',
              value: device25Total,
              itemStyle: {color: '#00ff88'},
            },
          ],
        },
        {
          // 外圈：工作模式数据
          data: [
            {
              name: '17号-凿岩',
              value: device17TotalDrill,
              itemStyle: {color: '#ff6b6b'},
              labelLine: {lineStyle: {color: '#ff6b6b'}},
            },
            {
              name: '17号-行走',
              value: device17TotalTramming,
              itemStyle: {color: '#4ecdc4'},
              labelLine: {lineStyle: {color: '#4ecdc4'}},
            },
            {
              name: '17号-中位',
              value: device17TotalMedian,
              itemStyle: {color: '#ffe66d'},
              labelLine: {lineStyle: {color: '#ffe66d'}},
            },
            {
              name: '25号-凿岩',
              value: device25TotalDrill,
              itemStyle: {color: '#ff6b6b'},
              labelLine: {lineStyle: {color: '#ff6b6b'}},
            },
            {
              name: '25号-行走',
              value: device25TotalTramming,
              itemStyle: {color: '#4ecdc4'},
              labelLine: {lineStyle: {color: '#4ecdc4'}},
            },
            {
              name: '25号-中位',
              value: device25TotalMedian,
              itemStyle: {color: '#ffe66d'},
              labelLine: {lineStyle: {color: '#ffe66d'}},
            },
          ],
        },
      ],
    })
  }

  // 图表5：两台设备工作时间正负对比图
  if (
      deviceComparisonWorkHoursChartInstance &&
      device17Trends.length > 0 &&
      device25Trends.length > 0
  ) {
    const dates = device17Trends.map((item) => {
      const dateStr = item.date?.split(' ')[0] || ''
      return dateStr.substring(5) // MM-DD
    })

    // 盖亚17号数据（转为负值，显示在左侧）
    const device17DrillData = device17Trends.map(
        (item) => -(item.workHours?.drillMode || 0)
    )
    const device17TrammingData = device17Trends.map(
        (item) => -(item.workHours?.trammingMode || 0)
    )
    const device17MedianData = device17Trends.map(
        (item) => -(item.workHours?.medianMode || 0)
    )

    // 盖亚25号数据（保持正值，显示在右侧）
    const device25DrillData = device25Trends.map(
        (item) => item.workHours?.drillMode || 0
    )
    const device25TrammingData = device25Trends.map(
        (item) => item.workHours?.trammingMode || 0
    )
    const device25MedianData = device25Trends.map(
        (item) => item.workHours?.medianMode || 0
    )

    console.log('正负对比图 - 日期:', dates)
    console.log(
        '盖亚17号凿岩（负值）:',
        device17DrillData.map((v) => v.toFixed(1))
    )
    console.log(
        '盖亚25号凿岩（正值）:',
        device25DrillData.map((v) => v.toFixed(1))
    )

    deviceComparisonWorkHoursChartInstance.setOption({
      title: {text: currentTimeRangeLabel.value + '发动机日工作时间对比'},
      yAxis: {
        data: dates,
      },
      series: [
        {data: device17DrillData}, // 17号-凿岩（负值）
        {data: device17TrammingData}, // 17号-行走（负值）
        {data: device17MedianData}, // 17号-中位（负值）
        {data: device25DrillData}, // 25号-凿岩（正值）
        {data: device25TrammingData}, // 25号-行走（正值）
        {data: device25MedianData}, // 25号-中位（正值）
      ],
    })
  }

  // 更新总油耗显示 - 使用当日油耗合计（从设备实时数据）
  const device17Fuel = Number(
      targetDevices.value.find((d) => d.remoteId === 'Epiroc131FD100011')
          ?.totalFuel || 0
  )
  const device25Fuel = Number(
      targetDevices.value.find((d) => d.remoteId === 'Epiroc120GD100018')
          ?.totalFuel || 0
  )
  totalFuel.value = (device17Fuel + device25Fuel).toFixed(0)

  console.log(
      '当日总油耗更新:',
      totalFuel.value,
      'L (盖亚17:',
      device17Fuel,
      'L + 盖亚25:',
      device25Fuel,
      'L)'
  )
}

const updateChartsWithMonthlyData = (dataSet) => {
  const {dates, device17, device25, dateRangeNote} = dataSet

  // 图表1：钻进深度和钻孔数混合图
  if (drillComboChartInstance) {
    drillComboChartInstance.setOption({
      title: {text: '钻进深度与钻孔数趋势',},
      xAxis: [
        {data: dates}, // 上方X轴（折线图）
        {data: dates}, // 下方X轴（柱状图）
      ],
      series: [
        {data: device17.map((d) => d.drilling.depth)}, // 盖亚17号钻进深度
        {data: device25.map((d) => d.drilling.depth)}, // 盖亚25号钻进深度
        {data: device17.map((d) => d.drilling.holes)}, // 盖亚17号钻孔数
        {data: device25.map((d) => d.drilling.holes)}, // 盖亚25号钻孔数
      ],
    })
  }

  // 图表2：气泡图（效率分析）
  if (workHoursChartInstance) {
    const device17BubbleData = device17.map((d, i) => [
      d.efficiency.depthPerEngineHour, // X轴：每发动机小时钻米
      d.efficiency.fuelPerMeter, // Y轴：平均油耗 (L/m)
      d.efficiency.utilizationRatio * 100, // 气泡大小：利用率
      dates[i],
    ])

    const device25BubbleData = device25.map((d, i) => [
      d.efficiency.depthPerEngineHour, // X轴：每发动机小时钻米
      d.efficiency.fuelPerMeter, // Y轴：平均油耗 (L/m)
      d.efficiency.utilizationRatio * 100, // 气泡大小：利用率
      dates[i],
    ])

    workHoursChartInstance.setOption({
      series: [{data: device17BubbleData}, {data: device25BubbleData}],
    })
  }

  // 图表4：工作时间旭日图
  if (workHoursSunburstChartInstance) {
    const device17TotalDrill = device17.reduce(
        (sum, d) => sum + d.workHours.drillMode,
        0
    )
    const device17TotalTramming = device17.reduce(
        (sum, d) => sum + d.workHours.trammingMode,
        0
    )
    const device17TotalMedian = device17.reduce(
        (sum, d) => sum + d.workHours.medianMode,
        0
    )
    const device17Total =
        device17TotalDrill + device17TotalTramming + device17TotalMedian

    const device25TotalDrill = device25.reduce(
        (sum, d) => sum + d.workHours.drillMode,
        0
    )
    const device25TotalTramming = device25.reduce(
        (sum, d) => sum + d.workHours.trammingMode,
        0
    )
    const device25TotalMedian = device25.reduce(
        (sum, d) => sum + d.workHours.medianMode,
        0
    )
    const device25Total =
        device25TotalDrill + device25TotalTramming + device25TotalMedian

    workHoursSunburstChartInstance.setOption({
      title: {
        text: currentTimeRangeLabel.value + '发动机总工作时间分析',
        textStyle: {...titleTextStyle},
      },
      series: [
        {
          // 内圈：设备数据
          data: [
            {
              name: '盖亚17号',
              value: device17Total,
              itemStyle: {color: '#00d9ff'},
            },
            {
              name: '盖亚25号',
              value: device25Total,
              itemStyle: {color: '#00ff88'},
            },
          ],
        },
        {
          // 外圈：工作模式数据
          data: [
            {
              name: '17号-凿岩',
              value: device17TotalDrill,
              itemStyle: {color: '#ff6b6b'},
              labelLine: {lineStyle: {color: '#ff6b6b'}},
            },
            {
              name: '17号-行走',
              value: device17TotalTramming,
              itemStyle: {color: '#4ecdc4'},
              labelLine: {lineStyle: {color: '#4ecdc4'}},
            },
            {
              name: '17号-中位',
              value: device17TotalMedian,
              itemStyle: {color: '#ffe66d'},
              labelLine: {lineStyle: {color: '#ffe66d'}},
            },
            {
              name: '25号-凿岩',
              value: device25TotalDrill,
              itemStyle: {color: '#ff6b6b'},
              labelLine: {lineStyle: {color: '#ff6b6b'}},
            },
            {
              name: '25号-行走',
              value: device25TotalTramming,
              itemStyle: {color: '#4ecdc4'},
              labelLine: {lineStyle: {color: '#4ecdc4'}},
            },
            {
              name: '25号-中位',
              value: device25TotalMedian,
              itemStyle: {color: '#ffe66d'},
              labelLine: {lineStyle: {color: '#ffe66d'}},
            },
          ],
        },
      ],
    })
  }

  // 图表5：两台设备工作时间对比图
  if (deviceComparisonWorkHoursChartInstance) {
    const device17DrillData = device17.map((d) => -d.workHours.drillMode)
    const device17TrammingData = device17.map((d) => -d.workHours.trammingMode)
    const device17MedianData = device17.map((d) => -d.workHours.medianMode)

    const device25DrillData = device25.map((d) => d.workHours.drillMode)
    const device25TrammingData = device25.map((d) => d.workHours.trammingMode)
    const device25MedianData = device25.map((d) => d.workHours.medianMode)

    deviceComparisonWorkHoursChartInstance.setOption({
      title: {text: currentTimeRangeLabel.value + '发动机日工作时间对比'},
      yAxis: {data: dates},
      series: [
        {data: device17DrillData},
        {data: device17TrammingData},
        {data: device17MedianData},
        {data: device25DrillData},
        {data: device25TrammingData},
        {data: device25MedianData},
      ],
    })
  }
}

const updateChartsWithData = (datasets, period = 'week') => {
  if (!datasets || !datasets.device17 || !datasets.device25) {
    console.warn('统计数据不完整，使用示例数据')
    return
  }

  const device17Records = datasets.device17?.data?.Epiroc131FD100011 || []
  const device25Records = datasets.device25?.data?.Epiroc120GD100018 || []

  console.log(`盖亚17号记录数 (${period}):`, device17Records.length)
  console.log(`盖亚25号记录数 (${period}):`, device25Records.length)

  if (device17Records.length === 0 && device25Records.length === 0) {
    console.warn('没有统计数据')
    return
  }

  let maxLen
  switch (period) {
    case 'week':
      maxLen = Math.min(device17Records.length, device25Records.length, 7)
      break
    case 'week2':
      maxLen = Math.min(device17Records.length, device25Records.length, 14)
      break
    case 'month':
      maxLen = Math.min(device17Records.length, device25Records.length, 30)
      break
    default:
      maxLen = Math.min(device17Records.length, device25Records.length, 7)
  }

  // 提取日期和钻进深度
  const dates = []
  const device17DrillDepth = []
  const device25DrillDepth = []

  for (let i = maxLen - 1; i >= 0; i--) {
    if (device17Records[i]) {
      const dateStr = device17Records[i].date?.split(' ')[0] || ''
      dates.push(dateStr.substring(5)) // 只显示MM-DD
      device17DrillDepth.push(device17Records[i].daily?.drilling?.depth || 0)
    }

    if (device25Records[i]) {
      device25DrillDepth.push(device25Records[i].daily?.drilling?.depth || 0)
    }
  }

  console.log(`日期 (${period}):`, dates)
  console.log(`盖亚17号钻深 (${period}):`, device17DrillDepth)
  console.log(`盖亚25号钻深 (${period}):`, device25DrillDepth)
}

/* region 百度地图 */
let baiduMapInstance = null
const deviceMarkers = []

const initBaiduMap = async () => {
  await nextTick()

  const mapContainer = document.getElementById('baidu-map')
  if (!mapContainer) {
    console.error('地图容器不存在')
    return
  }

  // 确保容器有正确的高度
  if (mapContainer.offsetHeight === 0) {
    console.warn('地图容器高度为0，等待DOM重排')
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log(
      `地图容器尺寸: ${mapContainer.offsetWidth}x${mapContainer.offsetHeight}`
  )

  // 检查百度地图API是否可用
  if (typeof BMap === 'undefined') {
    console.warn('百度地图API未加载，显示模拟地图')
    showMockMap(mapContainer)
    return
  }

  console.log('✅ 百度地图API已就绪')

  try {
    console.log('开始初始化百度地图')
    baiduMapInstance = new BMap.Map(mapContainer)

    // 设置中心点（默认新疆哈密）
    const point = new BMap.Point(93.5154, 42.8185)
    baiduMapInstance.centerAndZoom(point, 13)
    const marker = new BMap.Marker(point)
    baiduMapInstance.addOverlay(marker)

    baiduMapInstance.addControl(new BMap.NavigationControl())
    baiduMapInstance.addControl(new BMap.ScaleControl())

    baiduMapInstance.enableScrollWheelZoom(true)

    // 添加地图类型控件
    baiduMapInstance.addControl(
        new BMap.MapTypeControl({
          mapTypes: [BMAP_NORMAL_MAP, BMAP_HYBRID_MAP],
        })
    )

    // baiduMapInstance.setMapStyle({style: 'midnight'})

    // 加载设备GPS位置
    await loadDeviceLocations()

    // 强制刷新地图瓦片
    setTimeout(() => {
      if (baiduMapInstance) {
        const center = baiduMapInstance.getCenter()
        baiduMapInstance.panTo(center)
      }
    }, 500)

    console.log('✅ 百度地图初始化完成')
  } catch (error) {
    console.error('百度地图初始化失败:', error)
    showMockMap(mapContainer)
  }
}

const showMockMap = (container) => {
  container.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      color: #fff;
      position: relative;
      overflow: hidden;
    ">
      <!-- 模拟地图网格 -->
      <div style="
        position: absolute;
        width: 100%;
        height: 100%;
        background-image:
          linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
        background-size: 50px 50px;
        opacity: 0.3;
      "></div>

      <!-- 设备标记 -->
      <div style="position: relative; z-index: 1; text-align: center;">
        <div style="margin-bottom: 30px;">
          <div style="
            width: 60px;
            height: 60px;
            background: #00ff88;
            border-radius: 50%;
            margin: 0 auto 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.6);
          ">17</div>
          <p style="margin: 0; font-size: 14px;">盖亚17号</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #aaa;">E 120.45° N 41.58°</p>
        </div>

        <div>
          <div style="
            width: 60px;
            height: 60px;
            background: #00d9ff;
            border-radius: 50%;
            margin: 0 auto 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            box-shadow: 0 0 20px rgba(0, 217, 255, 0.6);
          ">25</div>
          <p style="margin: 0; font-size: 14px;">盖亚25号</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #aaa;">E 120.47° N 41.56°</p>
        </div>
      </div>

      <!-- 提示信息 -->
      <div style="
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.5);
        padding: 10px 20px;
        border-radius: 20px;
        font-size: 12px;
      ">
        模拟GPS位置显示 (百度地图API未配置)
      </div>
    </div>
  `
}

const loadDeviceLocations = async () => {
  try {
    const res = await getGpsLocations()
    console.log('GPS位置数据:', res)

    if (res.data && Array.isArray(res.data)) {
      res.data.forEach((location) => {
        addDeviceMarker(location)
      })

      // 如果有设备位置，调整地图中心
      if (res.data.length > 0 && baiduMapInstance) {
        const firstLocation = res.data[0]
        const lat = parseFloat(firstLocation.latitude)
        const lng = parseFloat(firstLocation.longitude)

        if (!isNaN(lat) && !isNaN(lng)) {
          const point = new BMap.Point(lng, lat)
          baiduMapInstance.setCenter(point)
        }
      }
    }
  } catch (error) {
    console.error('加载GPS位置失败:', error)
    // 加载失败时添加模拟标记
    addMockDeviceMarkers()
  }
}

// 添加模拟设备标记（当API失败时）
const addMockDeviceMarkers = () => {
  if (!baiduMapInstance || typeof BMap === 'undefined') return

  const mockLocations = [
    {
      remoteId: 'Epiroc131FD100011',
      deviceName: '盖亚17号',
      latitude: 41.5765,
      longitude: 120.4513,
      status: 'online',
    },
    {
      remoteId: 'Epiroc120GD100018',
      deviceName: '盖亚25号',
      latitude: 41.5645,
      longitude: 120.4713,
      status: 'online',
    },
  ]

  mockLocations.forEach((location) => {
    addDeviceMarker(location)
  })
}

// 添加设备标记
const addDeviceMarker = (location) => {
  if (!baiduMapInstance || typeof BMap === 'undefined') return

  const {latitude, longitude, deviceName, status} = location

  // 转换坐标格式（如果需要）
  const lat = parseFloat(latitude) || 41.3856
  const lng = parseFloat(longitude) || 119.5747

  const point = new BMap.Point(lng, lat)

  const marker = new BMap.Marker(point, {
    title: deviceName,
  })

  const iconColor = status === 'online' ? 'green' : 'red'
  const icon = new BMap.Icon(
      `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="12" fill="${iconColor}"/></svg>`,
      new BMap.Size(32, 32)
  )
  marker.setIcon(icon)

  // 添加点击事件
  marker.addEventListener('click', () => {
    const infoWindow = new BMap.InfoWindow(`
      <div style="padding: 10px;">
        <h4 style="margin: 0 0 10px 0;">${deviceName}</h4>
        <p>状态: ${status === 'online' ? '在线' : '离线'}</p>
        <p>经度: ${lng.toFixed(6)}</p>
        <p>纬度: ${lat.toFixed(6)}</p>
      </div>
    `)
    baiduMapInstance.openInfoWindow(infoWindow, point)
  })

  baiduMapInstance.addOverlay(marker)
  deviceMarkers.push(marker)
}
/* endregion 百度地图 */

let timeInterval = null

const handleResize = () => {
  updateDashboardScale()
  if (drillComboChartInstance) drillComboChartInstance.resize()
  if (workHoursChartInstance) workHoursChartInstance.resize()
  if (workHoursSunburstChartInstance) workHoursSunburstChartInstance.resize()
  if (deviceComparisonWorkHoursChartInstance)
    deviceComparisonWorkHoursChartInstance.resize()

  targetDevices.value.forEach((device) =>
      device.calendarChartInstance?.resize()
  )
}

const startTimeRangeAutoSwitch = () => {
  console.log(`启动时间范围自动切换 (间隔: ${SWITCH_INTERVAL_SECONDS}秒)`)

  timeRangeSwitchInterval = setInterval(() => {
    // 切换到下一个时间范围
    currentTimeRangeIndex.value =
        (currentTimeRangeIndex.value + 1) % TIME_RANGES.length
    currentTimeRange.value = TIME_RANGES[currentTimeRangeIndex.value]

    console.log(`自动切换时间范围: ${currentTimeRange.value}`)

    // 加载新时间范围的数据
    loadTrendsAndAggregatedData(currentTimeRange.value)
  }, SWITCH_INTERVAL_SECONDS * 1000)
}

const stopTimeRangeAutoSwitch = () => {
  if (timeRangeSwitchInterval) {
    clearInterval(timeRangeSwitchInterval)
    timeRangeSwitchInterval = null
    console.log('停止时间范围自动切换')
  }
}

watch(statisticsPeriod, (newPeriod) => {
  console.log('统计周期切换:', newPeriod)
  loadStatisticsData(newPeriod)
})

watch(currentTimeRange, (newRange) => {
  console.log('时间范围变化:', newRange)
  loadTrendsAndAggregatedData(newRange)
  if (timeRangeSwitchInterval) {
    stopTimeRangeAutoSwitch()
    startTimeRangeAutoSwitch()
  }
})

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)

  updateDashboardScale()

  connectWebSocket()

  nextTick(() => {
    initCharts()

    // initBaiduMap()

    loadInitialData()

    loadTrendsAndAggregatedData(currentTimeRange.value)

    startTimeRangeAutoSwitch()
  })

  window.addEventListener('resize', handleResize)

  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })

  nextTick(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('自动全屏失败（可能需要用户手动触发）:', err.message)
      })
    }
  })
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  if (ws) {
    ws.close()
  }

  stopTimeRangeAutoSwitch()

  window.removeEventListener('resize', handleResize)

  document.removeEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })

  // 销毁所有图表实例
  if (drillComboChartInstance) drillComboChartInstance.dispose()
  if (workHoursChartInstance) workHoursChartInstance.dispose()
  if (workHoursSunburstChartInstance) workHoursSunburstChartInstance.dispose()
  if (deviceComparisonWorkHoursChartInstance)
    deviceComparisonWorkHoursChartInstance.dispose()

  targetDevices.value.forEach((device) =>
      device.calendarChartInstance?.dispose()
  )
})

const loadInitialData = async () => {
  try {
    loadDeviceCalendarData()

    const devicesRes = await getDevices()
    console.log('设备列表数据:', devicesRes)

    if (
        devicesRes.code === 200 &&
        devicesRes.data &&
        Array.isArray(devicesRes.data)
    ) {
      devicesRes.data.forEach((device) => {
        const targetDevice = targetDevices.value.find(
            (d) => d.remoteId === device.remoteId
        )
        if (targetDevice) {
          targetDevice.name =
              device.aliasName || device.deviceName || targetDevice.name
          targetDevice.status = device.status || 'online'
        }
      })

      // 使用API方法获取实时数据
      for (const device of devicesRes.data) {
        try {
          const realtimeData = await fetch(
              `/api/devices/${device.remoteId}/realtime`
          )
          const realtimeRes = await realtimeData.json()
          console.log(`${device.aliasName}实时数据:`, realtimeRes)

          if (realtimeRes.code === 200 && realtimeRes.data) {
            const targetDevice = targetDevices.value.find(
                (d) => d.remoteId === device.remoteId
            )
            if (targetDevice && realtimeRes.data) {
              const data = realtimeRes.data

              // 实时钻进数据
              if (data.drilling) {
                targetDevice.joints = data.drilling.joints || 0
                targetDevice.currentDepth = data.drilling.currentDepth || 0
                targetDevice.drillDepth = data.drilling.drillDepth || 0
                targetDevice.drillSpeed = data.drilling.speed || 0
                targetDevice.totalDepth = data.drilling.totalDepth || 0
              }

              // 发动机负荷
              if (data.engine) {
                targetDevice.engineLoad = data.engine.load || 0
              }

              // 当日生产数据
              if (data.today) {
                targetDevice.dayDepth = data.today.depth || 0
                targetDevice.drillDay = data.today.holes || 0
                targetDevice.utilizationRatio = data.today.utilizationRatio || 0
                targetDevice.depthPerEngineHour =
                    data.today.depthPerEngineHour || 0

                // 工作小时
                if (data.today.workHours) {
                  targetDevice.totalWorkHours = data.today.workHours.total || 0
                  targetDevice.drillModeHours =
                      data.today.workHours.drillMode || 0
                  targetDevice.trammingModeHours =
                      data.today.workHours.trammingMode || 0
                  targetDevice.medianModeHours =
                      data.today.workHours.medianMode || 0

                  // 计算百分比
                  const totalHours = targetDevice.totalWorkHours
                  if (totalHours > 0) {
                    targetDevice.drillModePercent = Math.round(
                        (targetDevice.drillModeHours / totalHours) * 100
                    )
                    targetDevice.trammingModePercent = Math.round(
                        (targetDevice.trammingModeHours / totalHours) * 100
                    )
                    targetDevice.medianModePercent = Math.round(
                        (targetDevice.medianModeHours / totalHours) * 100
                    )
                  } else {
                    targetDevice.drillModePercent = 0
                    targetDevice.trammingModePercent = 0
                    targetDevice.medianModePercent = 0
                  }
                }

                // 油耗
                if (data.today.fuel) {
                  targetDevice.totalFuel = data.today.fuel.total || 0
                  targetDevice.fuelDrill = data.today.fuel.drillMode || 0
                  targetDevice.fuelTramming = data.today.fuel.trammingMode || 0
                  targetDevice.fuelMedian = data.today.fuel.medianMode || 0

                  // 计算百分比
                  const totalFuel = targetDevice.totalFuel
                  if (totalFuel > 0) {
                    targetDevice.fuelDrillPercent = Math.round(
                        (targetDevice.fuelDrill / totalFuel) * 100
                    )
                    targetDevice.fuelTrammingPercent = Math.round(
                        (targetDevice.fuelTramming / totalFuel) * 100
                    )
                    targetDevice.fuelMedianPercent = Math.round(
                        (targetDevice.fuelMedian / totalFuel) * 100
                    )
                  } else {
                    targetDevice.fuelDrillPercent = 0
                    targetDevice.fuelTrammingPercent = 0
                    targetDevice.fuelMedianPercent = 0
                  }
                }
              }

              // 更新时间
              if (data.timestamp && data.timestamp.device) {
                targetDevice.updateTime = data.timestamp.device
              }

              console.log(`${targetDevice.name}数据更新完成:`, {
                joints: targetDevice.joints,
                dayDepth: targetDevice.dayDepth,
                totalWorkHours: targetDevice.totalWorkHours,
                totalFuel: targetDevice.totalFuel,
              })
            }
          }
        } catch (err) {
          console.error(`获取${device.aliasName}实时数据失败:`, err)
        }
      }
    }

    const alarmsRes = await getActiveAlarms()
    console.log('活动告警数据:', alarmsRes)
    if (alarmsRes.data && Array.isArray(alarmsRes.data)) {
      activeAlarms.value = alarmsRes.data.slice(0, 10)
    }
  } catch (error) {
    console.error('加载初始数据失败:', error)
  }
}
</script>

<style scoped lang="scss">
@use '../assets/variables.scss' as *;

.dashboard-wrapper {
  position: relative;
  width: 100vw;
  height: 100vh;
  font-size: $font-size-md;
  overflow: hidden;
  background: $color-bg-dark;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dashboard-container {
  width: 3840px;
  height: 2160px;
  color: $color-text-primary;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  // position由JavaScript动态设置，用于居中对齐
}

.dashboard-background,
.dashboard-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.dashboard-background {
  background: radial-gradient(
          circle at 20% 20%,
          rgba(33, 150, 243, 0.25),
          transparent 55%
  ),
  radial-gradient(circle at 80% 10%, rgba(41, 182, 246, 0.2), transparent 50%),
  radial-gradient(circle at 50% 80%, rgba(0, 230, 118, 0.18), transparent 55%),
  $color-bg-dark;
  z-index: $z-index-background;
  filter: saturate(120%);
}

.dashboard-overlay {
  z-index: $z-index-background;

  &::before,
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.3;
    background-size: 60px 60px;
    background-repeat: repeat;
    pointer-events: none;
  }

  &::before {
    background-image: linear-gradient(
            transparent 59px,
            rgba(68, 138, 255, 0.12) 1px
    ),
    linear-gradient(90deg, transparent 59px, rgba(68, 138, 255, 0.12) 1px);
  }

  &::after {
    background-image: linear-gradient(
            transparent 59px,
            rgba(0, 230, 118, 0.08) 1px
    ),
    linear-gradient(90deg, transparent 59px, rgba(0, 230, 118, 0.08) 1px);
    transform: translateY(-15px);
  }
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: $height-header;
  padding: 0 $spacing-7xl;
  background: $color-bg-header;
  backdrop-filter: blur(12px);
  box-shadow: $shadow-sm;
  position: relative;
  z-index: $z-index-header;
  flex-shrink: 0;
}

.header-left {
  h1 {
    font-size: $font-size-6xl;
    font-weight: $font-weight-bold;
    margin: 0;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: $spacing-4xl;
}

.ws-status {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  padding: $spacing-xs $spacing-md;
  border-radius: $radius-sm;
  background: rgba(0, 0, 0, 0.3);

  .ws-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: inline-block;
    position: relative;

    &.connected {
      background: #00e676;
      box-shadow: 0 0 12px rgba(0, 230, 118, 0.6);
      animation: pulse-green 2s ease-in-out infinite;
    }

    &.connecting {
      background: #ffd600;
      box-shadow: 0 0 12px rgba(255, 214, 0, 0.6);
      animation: pulse-yellow 1s ease-in-out infinite;
    }

    &.disconnected {
      background: #757575;
      box-shadow: 0 0 8px rgba(117, 117, 117, 0.4);
    }

    &.error {
      background: #ff1744;
      box-shadow: 0 0 12px rgba(255, 23, 68, 0.6);
      animation: pulse-red 1s ease-in-out infinite;
    }
  }

  &.connected {
    color: #00e676;
  }

  &.connecting {
    color: #ffd600;
  }

  &.disconnected {
    color: #9e9e9e;
  }

  &.error {
    color: #ff1744;
  }
}

@keyframes pulse-green {
  0%,
  100% {
    box-shadow: 0 0 12px rgba(0, 230, 118, 0.6);
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 230, 118, 0.9);
  }
}

@keyframes pulse-yellow {
  0%,
  100% {
    box-shadow: 0 0 12px rgba(255, 214, 0, 0.6);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 214, 0, 0.9);
  }
}

@keyframes pulse-red {
  0%,
  100% {
    box-shadow: 0 0 12px rgba(255, 23, 68, 0.6);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 23, 68, 0.9);
  }
}

.user-info,
.current-time {
  color: $color-text-secondary;
  font-size: $font-size-md;
  line-height: $font-size-md;
}

.fullscreen-btn,
.logout-btn {
  padding: $spacing-md $spacing-4xl;
  background: rgba(23, 162, 184, 0.15);
  border: $border-width solid $color-primary-transparent;
  color: $color-text-primary;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: all $transition-normal;
  font-size: $font-size-sm;

  &:hover {
    background: $color-primary-transparent;
    box-shadow: $shadow-glow-xl $color-primary-hover;
  }
}

.fullscreen-btn {
  margin-right: $spacing-lg;
  background: rgba(40, 167, 69, 0.15);
  border-color: rgba(40, 167, 69, 0.3);

  &:hover {
    background: rgba(40, 167, 69, 0.3);
    box-shadow: $shadow-glow-xl rgba(40, 167, 69, 0.5);
  }
}

.kpi-row {
  position: relative;
  z-index: $z-index-content;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-4xl;
  flex-shrink: 0;
}

.kpi-card {
  background: $color-bg-kpi;
  border: $border-width solid $color-primary-transparent;
  border-radius: $radius-lg;
  padding: $padding-xl;
  position: relative;
  overflow: hidden;
  transition: transform $transition-normal, box-shadow $transition-normal;

  &::before {
    content: '';
    position: absolute;
    top: -40px;
    right: -40px;
    width: 120px;
    height: 120px;
    background: radial-gradient(
            circle,
            rgba(0, 173, 239, 0.35),
            transparent 70%
    );
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: $radius-xl;
    border: $border-width solid rgba(0, 173, 239, 0.35);
    opacity: 0;
    transition: opacity $transition-normal;
  }

  &:hover {
    transform: translateY(-4px);

    &::after {
      opacity: 1;
    }
  }
}

.kpi-label {
  font-size: $font-size-base;
  color: $color-text-light;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: $font-weight-bold;
}

.kpi-value {
  display: block;
  font-size: $font-size-8xl;
  font-weight: $font-weight-bold;
  margin: $spacing-xs 0 $spacing-xs;
  color: #e4f3ff;
}

.dashboard-content {
  position: relative;
  z-index: $z-index-content;
  display: flex;
  justify-content: space-between;
  gap: $spacing-2xl;
  flex: 1;
  overflow: hidden;
  min-height: 0;
  padding: $padding-panel;
}

.dashboard-left {
  width: $width-left-panel;
  min-width: $width-left-panel-min;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-grow: 1;
}

.dashboard-right {
  width: $width-right-panel;
  display: flex;
  flex-direction: column;
  gap: $spacing-2xl;
  overflow: hidden;
}

.dashboard-panel {
  background: $color-bg-panel;
  border: $border-width solid $color-border-primary;
  border-radius: $radius-2xl;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  //box-shadow: $shadow-sm;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $padding-lg;
  background: $color-bg-header;
  border-bottom: 1px solid $color-border-light;

  h2 {
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
    margin: 0;
  }
}

.panel-status {
  font-size: $font-size-md;
  color: $color-text-muted;
}

.panel-content {
  flex: 1;
  padding: $spacing-lg;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: $scrollbar-width;
  }

  &::-webkit-scrollbar-track {
    background: $scrollbar-bg;
    border-radius: calc($spacing-xs / 2);
  }

  &::-webkit-scrollbar-thumb {
    background: $scrollbar-thumb;
    border-radius: calc($spacing-xs / 2);

    &:hover {
      background: $scrollbar-thumb-hover;
    }
  }
}

.panel-device-monitor {
  flex: 1;
}

.panel-statistics,
.panel-energy {
  flex: 1;
  min-height: 0;
}

.time-range-indicator {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-md;
  color: $color-text-muted;

  .range-label {
    color: $color-text-secondary;
  }

  .range-value {
    color: $color-primary;
    font-weight: $font-weight-semibold;
    font-size: $font-size-lg;
    padding: 2px 8px;
    background: rgba(0, 173, 237, 0.15);
    border-radius: $radius-sm;
    border: $border-width solid $color-primary-transparent;
    margin-right: $padding-lg;
  }
}

.statistics-grid-new {
  display: grid !important;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-md;
  height: 100%;

  .chart-left,
  .chart-right {
    width: 100%;
    height: 100%;
    min-height: 300px;
  }
}

.header-right-section {
  display: flex;
  align-items: center;
  gap: $spacing-4xl;
}

.device-legend {
  display: flex;
  gap: $spacing-3xl;
  font-size: $font-size-md;

  .legend-item {
    display: flex;
    align-items: center;
    color: $color-text-secondary;

    .legend-dot {
      width: $spacing-lg;
      height: $spacing-lg;
      border-radius: $radius-circle;
      margin-right: $spacing-xs;
      display: inline-block;

      &.device-17 {
        background: #00d9ff;
        box-shadow: 0 0 8px rgba(0, 217, 255, 0.6);
      }

      &.device-25 {
        background: #00ff88;
        box-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
      }
    }
  }
}

.energy-grid {
  display: grid;
  gap: $spacing-md;
  height: 100%;

  grid-template-columns: 1fr 2.5fr;
  grid-template-rows: 1fr;
  grid-auto-flow: row;
  grid-template-areas: 'af1 af23';

  .af1 {
    grid-area: af1;
  }

  .af23 {
    grid-area: af23;
  }
}

.device-card {
  background: $color-bg-card;
  border: $border-width solid $color-primary-dark;
  border-radius: $radius-md;
  padding: $padding-md;
  margin-bottom: $spacing-lg;
  display: flex;
  gap: $spacing-md;
  flex-flow: column;

  &.online {
    border-color: $color-border-online;
  }

  &.offline {
    border-color: $color-border-offline;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.device-main {
  display: flex;
  flex-flow: column;
  justify-content: space-between;

  .device-main-content {
    flex: 1;
    min-width: 0;
    margin-right: $spacing-xs;
  }

  .section-calendar {
    display: flex;
    flex-flow: column;
    flex-wrap: nowrap;
    justify-content: space-between;
    flex-grow: 1;
    position: relative;

    .section-title {
      position: absolute;
    }

    .device-utilization-calendar {
      min-width: 520px;
      min-height: 220px;
      //width: 120px;
      //height: 360px;
      flex-shrink: 0;
      //background: rgba(0, 255, 255, 0.05);
      //border-left: 1px solid rgba(0, 255, 255, 0.2);
      border-radius: $radius-sm;
    }
  }
}

.device-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid $color-border-secondary;
}

.device-name {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  display: flex;
  align-items: center;

  .device-remote-id {
    margin-left: $padding-lg;
    color: $color-text-muted;
  }
}

.device-update-time {
  color: $color-text-muted;
  position: relative;
  font-size: $font-size-base;
  line-height: $font-size-base;

  .el-icon {
    font-size: $font-size-2xl;
    position: absolute;
    transform: translateX(-120%);
    top: -4px;
    transition: transform 0.8s ease-in-out;

    &.icon-rotating {
      animation: rotate-once 0.8s ease-in-out;
    }
  }
}

@keyframes rotate-once {
  from {
    transform: translateX(-120%) rotate(0deg);
  }
  to {
    transform: translateX(-120%) rotate(360deg);
  }
}

.status-dot {
  width: $spacing-md;
  height: $spacing-md;
  border-radius: $radius-circle;
  margin-right: $spacing-sm;

  &.online {
    background: $color-online;
    box-shadow: $shadow-glow $color-online;
    animation: pulse 2s infinite;
  }

  &.offline {
    background: $color-offline;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.device-section {
  margin-bottom: $spacing-2xl;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-desc {
  display: flex;
  flex-flow: row;
  flex-wrap: nowrap;
  justify-content: space-between;
  flex-grow: 1;

  .mode-legend {
    display: flex;
    gap: $padding-md;
    font-size: $font-size-md;
    flex-wrap: nowrap;
    flex-flow: row;
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
  }
}

.section-title {
  font-size: $font-size-md;
  color: #90caf9;
  margin-bottom: $spacing-sm;
  font-weight: $font-weight-semibold;
}

.param-container {
  display: grid;
  gap: $spacing-md;
  height: 100%;
  line-height: $font-size-md;

  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  grid-auto-flow: row;
  grid-template-areas:
    'param-item param-item'
    'param-item param-item';

  .param-item {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    background: $color-bg-param;
    padding: $padding-md;
    border-radius: $radius-sm;
    min-width: 100px;
    flex-grow: 1;
    flex-shrink: 0;

    label {
      color: $color-text-tertiary;
      margin-bottom: 2px;
    }
  }
}

.param-value {
  font-size: $font-size-base;
  font-weight: $font-weight-semibold;
  color: $color-info;

  &.highlight {
    color: $color-success;
    font-weight: $font-weight-bold;
  }
}

.work-hours-bar,
.fuel-bar {
  display: flex;
  height: $height-bar;
  background: $color-bg-bar;
  border-radius: $radius-sm;
  overflow: hidden;
  margin-bottom: 5px;
}

.bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-md;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  transition: width $transition-normal;

  span {
    text-shadow: $shadow-sm;
  }

  &.drill-mode,
  &.fuel-drill {
    background: $color-mode-drill-gradient;
  }

  &.tramming-mode,
  &.fuel-tramming {
    background: $color-mode-tramming-gradient;
  }

  &.median-mode,
  &.fuel-median {
    background: $color-mode-median-gradient;
  }
}

.legend-item {
  display: flex;
  align-items: center;
  color: $color-text-tertiary;
}

.legend-dot {
  width: $spacing-md;
  height: $spacing-md;
  border-radius: 2px;
  margin-right: $spacing-xs;
  display: inline-block;

  &.drill-mode,
  &.fuel-drill {
    background: $color-mode-drill;
  }

  &.tramming-mode,
  &.fuel-tramming {
    background: $color-mode-tramming;
  }

  &.median-mode,
  &.fuel-median {
    background: $color-mode-median;
  }
}

.time-selector {
  display: flex;
  gap: 10px;

  button {
    padding: 10px 30px;
    background: rgba(255, 255, 255, 0.1);
    border: $border-width solid $color-primary-transparent;
    color: $color-text-primary;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: all $transition-normal;

    &.active {
      background: linear-gradient(
              120deg,
              $color-primary-light,
              $color-secondary-light
      );
      border-color: transparent;
      box-shadow: $shadow-glow-2xl $color-primary-hover;
    }
  }
}

.chart-container {
  flex: 1;
  min-height: 0;
  background: $color-bg-chart;
  border-radius: $radius-md;
  margin-bottom: $padding-md;

  &:last-child {
    margin-bottom: 0;
  }
}

.panel-device-monitor,
.panel-statistics {
  .panel-content {
    display: flex;
    flex-direction: column;
    padding: $padding-xl;
    overflow: hidden;
  }
}

.energy-total {
  font-size: $font-size-lg;
  color: $color-text-secondary;
}

@media (max-width: $breakpoint-desktop) {
  .dashboard-header h1 {
    font-size: $font-size-4xl;
  }
}

@media (max-width: $breakpoint-laptop) {
  .dashboard-content {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, minmax(320px, auto));
    grid-template-areas:
      'devices'
      'stats'
      'map'
      'energy';
    height: auto;
  }

  .dashboard-panel {
    min-height: 400px;
  }
}

// ========================================
// 分辨率自适应说明
// ========================================
// 采用4K基准设计（3840x2160），通过CSS transform scale实现多分辨率适配
//
// 1080p (1920x1080): scale=0.5，4K设计的字体(22-52px)缩放后为(11-26px)
//                    这是1080p下的正常字体范围，保证可读性
//
// 4K (3840x2160):   scale=1.0，使用原始设计字体(22-52px)
//                    确保4K下的清晰度和可读性
//
// 其他分辨率:        自动计算scale比例，保持布局完整性
</style>
