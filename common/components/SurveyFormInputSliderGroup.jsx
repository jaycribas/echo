import React, {PropTypes} from 'react'
import Chip from 'react-toolbox/lib/chip'
import Avatar from 'react-toolbox/lib/avatar'
import Slider from 'react-toolbox/lib/slider'

import {Flex} from './Layout'

import styles from './SurveyFormInputSliderGroup.css'

class SurveyFormInputSliderGroup extends React.Component {
  constructor(props) {
    super(props)
    this.handleInputChange = this.handleInputChange.bind(this)
  }

  getSumWithNewValue(newValue, newValueIndex) {
    return this.props.options.reduce((result, option, optionIndex) => {
      result += newValueIndex === optionIndex ?
        (parseInt(newValue, 10) || 0) :
        parseInt((option.value || 0), 10)

      return result
    }, 0)
  }

  sliderPropsForOption(option) {
    return {
      step: 1,
      min: 0,
      max: this.props.sum,
      value: parseInt(option.value || 0, 10),
    }
  }

  handleInputChange(value, index) {
    const {options, sum} = this.props
    let newValue = parseInt(value, 10)
    const newTotal = this.getSumWithNewValue(newValue, index)

    if (!isNaN(sum) && newTotal > sum) {
      newValue = sum - this.getSumWithNewValue(0, index)
    }

    if (options[index] && this.props.onChange) {
      this.props.onChange(newValue, options[index].payload)
    } else {
      console.error(`Option input not found for updated value ${value} at index ${index}`)
    }
  }

  renderOptionSubject(option, i) {
    return (
      <Flex alignItems="center" key={i} className={styles.chipContainer}>
        <Chip className={styles.chip}>
          <Flex alignItems="center" height="100%">
            <span className={styles.chipAvatar}>{this.renderSliderAvatar(option)}</span>
            <span>{option.label}</span>
          </Flex>
        </Chip>
      </Flex>
    )
  }

  renderOptionSlider(option, i) {
    const sliderProps = this.sliderPropsForOption(option)
    const handleChange = value => this.handleInputChange(value, i)
    return (
      <Flex justifyContent="center" alignItems="center" key={i} className={styles.sliderContainer}>
        <Slider {...sliderProps} onChange={handleChange} className={styles.slider}/>
      </Flex>
    )
  }

  renderSliderAvatar(option) {
    return option.imageUrl ?
      <Avatar><img src={option.imageUrl}/></Avatar> :
      <Avatar icon="person"/>
  }

  renderOptionPercentage(option, i) {
    return (
      <Flex justifyContent="flex-end" alignItems="center" key={i} className={styles.percentageContainer}>
        <h5>{`${parseInt(option.value || 0, 10)}%`}</h5>
      </Flex>
    )
  }

  render() {
    return (
      <Flex flexDirection="column" width="100%">
        <div className={styles.hint}><strong>{this.props.hint}</strong></div>

        <div>
          <Flex>
            <Flex flexDirection="column" flex={1}>
              {this.props.options.map((option, i) => this.renderOptionSubject(option, i))}
            </Flex>

            <Flex flexDirection="column" flex={9}>
              {this.props.options.map((option, i) => this.renderOptionSlider(option, i))}
            </Flex>

            <Flex flexDirection="column" flex={1}>
              {this.props.options.map((option, i) => this.renderOptionPercentage(option, i))}
            </Flex>
          </Flex>

          <Flex justifyContent="flex-end" className={styles.sumPercentageContainer}>
            <h5 className={styles.sumPercentage}>{`${this.getSumWithNewValue()}%`}</h5>
          </Flex>
        </div>
      </Flex>
    )
  }
}

SurveyFormInputSliderGroup.propTypes = {
  hint: PropTypes.string.isRequired,
  sum: PropTypes.number.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.any,
    imageUrl: PropTypes.string,
    value: PropTypes.any,
    payload: PropTypes.any,
  })),
  onChange: PropTypes.func,
}

export default SurveyFormInputSliderGroup